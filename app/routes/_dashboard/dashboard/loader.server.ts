import { parseWithZod } from '@conform-to/zod'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import { filterSchema } from './schema'
import invariant from 'tiny-invariant'
import { parseISO } from 'date-fns'
import {
	getAuthorizedEntities,
	getEntityName,
	getEntityStats,
} from './utils.server'
import {
	prepareDateRanges,
	fetchAttendanceData,
} from '~/helpers/attendance.server'
import { getMembersAttendances } from '~/shared/attendance'
import {
	getAttendanceStats,
	getEntityStatsForChurchAdmin,
} from './admin-utils.server'
import type { z } from 'zod'
import type { AuthorizedEntity } from './types'

const MANAGER_ROLES = [
	'TRIBE_MANAGER',
	'DEPARTMENT_MANAGER',
	'HONOR_FAMILY_MANAGER',
] as const

function clearOtherEntityIds(
	user: Awaited<ReturnType<typeof requireUser>>,
	type: string,
) {
	if (type !== 'department') user.departmentId = null
	if (type !== 'tribe') user.tribeId = null
	if (type !== 'honorFamily') user.honorFamilyId = null
}

function resolveSelectedEntity(
	authorizedEntities: AuthorizedEntity[],
	entityType?: string,
	entityId?: string,
) {
	return entityType && entityId
		? authorizedEntities.find(e => e.type === entityType && e.id === entityId)
		: authorizedEntities[0]
}

async function fetchManagerMembers(
	user: Awaited<ReturnType<typeof requireUser>>,
	selectedEntity: AuthorizedEntity,
	baseWhere: object,
	value: z.infer<typeof filterSchema>,
) {
	const contains = `%${value.query.replace(/ /g, '%')}%`
	return prisma.user.findMany({
		where: {
			[`${selectedEntity.type}Id`]: selectedEntity.id,
			...baseWhere,
			NOT: { isActive: false, deletedAt: { not: null } },
			OR: [
				{ name: { contains, mode: 'insensitive' } },
				{ phone: { contains } },
			],
		},
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
			location: true,
			gender: true,
			maritalStatus: true,
			birthday: true,
			integrationDate: true,
			pictureUrl: true,
			createdAt: true,
		},
		take: value.page * value.take,
	})
}

async function fetchManagerCounts(
	selectedEntity: AuthorizedEntity,
	baseWhere: object,
) {
	const softFilter = { NOT: { isActive: false, deletedAt: { not: null } } }
	const entityFilter = { [`${selectedEntity.type}Id`]: selectedEntity.id }
	const [total, membersCount] = await Promise.all([
		prisma.user.count({
			where: { ...entityFilter, ...baseWhere, ...softFilter },
		}),
		prisma.user.count({ where: { ...entityFilter, ...softFilter } }),
	])
	return { total, membersCount }
}

async function buildManagerData(
	user: Awaited<ReturnType<typeof requireUser>>,
	value: z.infer<typeof filterSchema>,
	fromDate: Date,
	processedToDate: Date,
	currentMonthSundays: Date[],
	previousMonthSundays: Date[],
	previousFrom: Date,
	previousTo: Date,
	baseWhere: object,
) {
	const authorizedEntities = await getAuthorizedEntities(user)
	invariant(
		authorizedEntities.length > 0,
		"L'utilisateur n'est pas autorisé à accéder aux données d'une entité.",
	)

	const selectedEntity = resolveSelectedEntity(
		authorizedEntities,
		value.entityType,
		value.entityId,
	)
	invariant(selectedEntity, 'Impossible de sélectionner une entité valide.')

	clearOtherEntityIds(user, selectedEntity.type)

	const members = await fetchManagerMembers(
		user,
		selectedEntity,
		baseWhere,
		value,
	)
	const { services, allAttendances, previousAttendances } =
		await fetchAttendanceData(
			user,
			members.map(m => m.id),
			fromDate,
			processedToDate,
			previousFrom,
			previousTo,
		)
	const { total, membersCount } = await fetchManagerCounts(
		selectedEntity,
		baseWhere,
	)

	const entityName = await getEntityName(selectedEntity)
	invariant(
		entityName,
		"L'entité spécifiée n'existe pas ou l'utilisateur n'en est pas le responsable.",
	)

	const additionalEntityStats = await Promise.all(
		authorizedEntities
			.filter(e => e.id !== selectedEntity.id)
			.map(e => getEntityStats(e.type, e.id, value)),
	)

	const membersWithAttendances = getMembersAttendances(
		members,
		currentMonthSundays,
		previousMonthSundays,
		allAttendances,
		previousAttendances,
	)

	return {
		members: membersWithAttendances,
		entityStats: [
			{
				id: selectedEntity.id,
				type: selectedEntity.type,
				entityName: entityName.name,
				memberCount: membersCount,
				members: membersWithAttendances,
			},
			...additionalEntityStats,
		],
		total,
		services,
	}
}

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const user = await requireUser(request)
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})
	invariant(submission.status === 'success', 'params must be defined')

	const { value } = submission
	const toDate = parseISO(value.to)
	const {
		toDate: processedToDate,
		currentMonthSundays,
		previousMonthSundays,
		previousFrom,
		previousTo,
	} = prepareDateRanges(toDate)
	const baseWhere = { createdAt: { lte: processedToDate } }

	const { roles } = user
	const isChurchAdmin = roles.includes('ADMIN')
	const isSuperAdmin = roles.includes('SUPER_ADMIN')
	const isAlsoManager = roles.some(r =>
		(MANAGER_ROLES as readonly string[]).includes(r),
	)

	if (isSuperAdmin) {
		return {
			user,
			isChurchAdmin,
			isAlsoManager: false,
			members: [],
			entityStats: [],
			filterData: value,
			total: null,
			adminEntityStats: null,
			attendanceStats: [null],
			services: null,
		}
	}

	if (isChurchAdmin && user?.churchId) {
		const [entityStats, attendanceStats] = await Promise.all([
			getEntityStatsForChurchAdmin(user.churchId),
			getAttendanceStats(user.churchId, parseISO(value.yearDate)),
		])

		if (!isAlsoManager) {
			return {
				user,
				isChurchAdmin,
				isAlsoManager: false,
				members: [],
				entityStats: [],
				filterData: value,
				total: null,
				adminEntityStats: entityStats,
				attendanceStats,
				services: null,
			}
		}

		const managerData = await buildManagerData(
			user,
			value,
			parseISO(value.from),
			processedToDate,
			currentMonthSundays,
			previousMonthSundays,
			previousFrom,
			previousTo,
			baseWhere,
		)
		return {
			user,
			isChurchAdmin,
			isAlsoManager: true,
			filterData: value,
			adminEntityStats: entityStats,
			attendanceStats,
			...managerData,
		}
	}

	const managerData = await buildManagerData(
		user,
		value,
		parseISO(value.from),
		processedToDate,
		currentMonthSundays,
		previousMonthSundays,
		previousFrom,
		previousTo,
		baseWhere,
	)
	return {
		user,
		isChurchAdmin: false,
		isAlsoManager: false,
		filterData: value,
		adminEntityStats: null,
		attendanceStats: null,
		...managerData,
	}
}

export type LoaderType = typeof loaderFn
