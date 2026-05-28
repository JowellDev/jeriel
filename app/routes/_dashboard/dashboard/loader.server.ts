import { parseWithZod } from '@conform-to/zod'
import { Role } from '@prisma/client'
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

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN]

type DashboardDateRanges = {
	fromDate: Date
	processedToDate: Date
	currentMonthSundays: Date[]
	previousMonthSundays: Date[]
	previousFrom: Date
	previousTo: Date
}

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
			isActive: true,
			NOT: { roles: { hasSome: ADMIN_ROLES } },
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
	const softFilter = {
		isActive: true,
		NOT: { roles: { hasSome: ADMIN_ROLES } },
	}
	const entityFilter = { [`${selectedEntity.type}Id`]: selectedEntity.id }

	const [total, membersCount] = await Promise.all([
		prisma.user.count({
			where: { ...entityFilter, ...baseWhere, ...softFilter },
		}),
		prisma.user.count({ where: { ...entityFilter, ...softFilter } }),
	])

	return { total, membersCount }
}

async function buildEntityStatsList(
	selectedEntity: AuthorizedEntity,
	entityName: { name: string },
	membersCount: number,
	membersWithAttendances: ReturnType<typeof getMembersAttendances>,
	authorizedEntities: AuthorizedEntity[],
	value: z.infer<typeof filterSchema>,
) {
	const additionalStats = await Promise.all(
		authorizedEntities
			.filter(e => e.id !== selectedEntity.id)
			.map(e => getEntityStats(e.type, e.id, value)),
	)

	return [
		{
			id: selectedEntity.id,
			type: selectedEntity.type,
			entityName: entityName.name,
			memberCount: membersCount,
			members: membersWithAttendances,
		},
		...additionalStats,
	]
}

async function buildManagerData(
	user: Awaited<ReturnType<typeof requireUser>>,
	value: z.infer<typeof filterSchema>,
	dateRanges: DashboardDateRanges,
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

	const [members, { total, membersCount }, entityName] = await Promise.all([
		fetchManagerMembers(user, selectedEntity, baseWhere, value),
		fetchManagerCounts(selectedEntity, baseWhere),
		getEntityName(selectedEntity),
	])

	invariant(
		entityName,
		"L'entité spécifiée n'existe pas ou l'utilisateur n'en est pas le responsable.",
	)

	const { services, allAttendances, previousAttendances } =
		await fetchAttendanceData(
			user,
			members.map(m => m.id),
			dateRanges.fromDate,
			dateRanges.processedToDate,
			dateRanges.previousFrom,
			dateRanges.previousTo,
		)

	const membersWithAttendances = getMembersAttendances(
		members,
		dateRanges.currentMonthSundays,
		dateRanges.previousMonthSundays,
		allAttendances,
		previousAttendances,
	)

	const entityStats = await buildEntityStatsList(
		selectedEntity,
		entityName,
		membersCount,
		membersWithAttendances,
		authorizedEntities,
		value,
	)

	return { members: membersWithAttendances, entityStats, total, services }
}

function parseDashboardFilter(request: Request) {
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	return submission.value
}

function buildDashboardDateRanges(
	value: z.infer<typeof filterSchema>,
): DashboardDateRanges {
	const {
		toDate: processedToDate,
		currentMonthSundays,
		previousMonthSundays,
		previousFrom,
		previousTo,
	} = prepareDateRanges(parseISO(value.to))

	return {
		fromDate: parseISO(value.from),
		processedToDate,
		currentMonthSundays,
		previousMonthSundays,
		previousFrom,
		previousTo,
	}
}

function getUserRoleFlags(roles: string[]) {
	return {
		isChurchAdmin: roles.includes('ADMIN'),
		isSuperAdmin: roles.includes('SUPER_ADMIN'),
		isAlsoManager: roles.some(r =>
			(MANAGER_ROLES as readonly string[]).includes(r),
		),
	}
}

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const user = await requireUser(request)

	const value = parseDashboardFilter(request)
	const dateRanges = buildDashboardDateRanges(value)

	const baseWhere = { createdAt: { lte: dateRanges.processedToDate } }

	const { isChurchAdmin, isSuperAdmin, isAlsoManager } = getUserRoleFlags(
		user.roles,
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
		const [adminEntityStats, attendanceStats] = await Promise.all([
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
				adminEntityStats,
				attendanceStats,
				services: null,
			}
		}

		const managerData = await buildManagerData(
			user,
			value,
			dateRanges,
			baseWhere,
		)

		return {
			user,
			isChurchAdmin,
			isAlsoManager: true,
			filterData: value,
			adminEntityStats,
			attendanceStats,
			...managerData,
		}
	}

	const managerData = await buildManagerData(user, value, dateRanges, baseWhere)

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
