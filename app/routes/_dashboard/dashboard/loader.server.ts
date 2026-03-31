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

const MANAGER_ROLES = [
	'TRIBE_MANAGER',
	'DEPARTMENT_MANAGER',
	'HONOR_FAMILY_MANAGER',
] as const

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

	if (authorizedEntities.length === 0) {
		throw new Error(
			"L'utilisateur n'est pas autorisé à accéder aux données d'une entité.",
		)
	}

	const selectedEntity =
		value.entityType && value.entityId
			? authorizedEntities.find(
					entity =>
						entity.type === value.entityType && entity.id === value.entityId,
				)
			: authorizedEntities[0]

	invariant(selectedEntity, 'Impossible de sélectionner une entité valide.')

	switch (selectedEntity.type) {
		case 'department':
			user.tribeId = null
			user.honorFamilyId = null
			break
		case 'tribe':
			user.departmentId = null
			user.honorFamilyId = null
			break
		case 'honorFamily':
			user.departmentId = null
			user.tribeId = null
			break
	}

	const contains = `%${value.query.replace(/ /g, '%')}%`

	const members = await prisma.user.findMany({
		where: {
			[`${selectedEntity.type}Id`]: selectedEntity.id,
			...baseWhere,
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

	const memberIds = members.map(m => m.id)
	const { services, allAttendances, previousAttendances } =
		await fetchAttendanceData(
			user,
			memberIds,
			fromDate,
			processedToDate,
			previousFrom,
			previousTo,
		)

	const total = await prisma.user.count({
		where: { [`${selectedEntity.type}Id`]: selectedEntity.id, ...baseWhere },
	})

	const membersCount = await prisma.user.count({
		where: { [`${selectedEntity.type}Id`]: selectedEntity.id },
	})

	const entityName = await getEntityName(selectedEntity)

	if (!entityName) {
		throw new Error(
			"L'entité spécifiée n'existe pas ou l'utilisateur n'en est pas le responsable.",
		)
	}

	const additionalEntityStats = authorizedEntities
		.filter(entity => entity.id !== selectedEntity?.id)
		.map(async entity => await getEntityStats(entity.type, entity.id, value))

	const resolvedAdditionalEntityStats = await Promise.all(additionalEntityStats)

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
			...resolvedAdditionalEntityStats,
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

	const fromDate = parseISO(value.from)
	const toDate = parseISO(value.to)

	const {
		toDate: processedToDate,
		currentMonthSundays,
		previousMonthSundays,
		previousFrom,
		previousTo,
	} = prepareDateRanges(toDate)

	const baseWhere = {
		createdAt: {
			lte: processedToDate,
		},
	}

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
			fromDate,
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
		fromDate,
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
