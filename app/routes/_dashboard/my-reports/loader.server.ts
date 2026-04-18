import { type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { prisma } from '~/infrastructures/database/prisma.server'
import { requireUser } from '~/utils/auth.server'
import { normalizeDate } from '~/utils/date'
import { filterSchema } from './schema'
import type { Prisma, User } from '@prisma/client'
import { Role } from '@prisma/client'

interface ManagedEntity {
	id: string
	name: string
	members: any[]
	services?: any[]
}

interface ManagedEntities {
	tribe: ManagedEntity | null
	department: ManagedEntity | null
	honorFamily: ManagedEntity | null
}

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	invariant(currentUser.churchId, 'Church ID is required')

	const isManager =
		currentUser.roles.includes(Role.TRIBE_MANAGER) ||
		currentUser.roles.includes(Role.DEPARTMENT_MANAGER) ||
		currentUser.roles.includes(Role.HONOR_FAMILY_MANAGER)

	if (!isManager) {
		throw new Response('Unauthorized', { status: 403 })
	}

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: filterSchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const filterData = submission.value

	const startDate = filterData.from
		? normalizeDate(new Date(filterData.from), 'start')
		: undefined

	const endDate = normalizeDate(new Date(filterData.to), 'end')

	const { query } = filterData

	const contains = `%${query.replace(/ /g, '%')}%`

	const whereCondition: Prisma.AttendanceReportWhereInput = {
		submitterId: currentUser.id,
		createdAt: {
			gte: startDate,
			lte: endDate,
		},
		OR: [
			{ tribe: { name: { contains, mode: 'insensitive' } } },
			{ department: { name: { contains, mode: 'insensitive' } } },
			{ honorFamily: { name: { contains, mode: 'insensitive' } } },
		],
	}

	const [reports, total] = await Promise.all([
		getAttendanceReports(whereCondition, filterData.take, filterData.page),
		prisma.attendanceReport.count({ where: whereCondition }),
	])

	const managedEntities = await getCurrentUserManagedEntities(currentUser)

	return {
		total,
		reports,
		filterData,
		managedEntities,
	} as const
}

export type LoaderType = typeof loaderFn

function getAttendanceReports(
	where: Prisma.AttendanceReportWhereInput,
	take: number,
	page: number,
) {
	return prisma.attendanceReport.findMany({
		where,
		include: {
			tribe: {
				select: {
					manager: { select: { name: true, email: true } },
					name: true,
				},
			},
			department: {
				select: {
					manager: { select: { name: true, email: true } },
					name: true,
				},
			},
			honorFamily: {
				select: {
					manager: { select: { name: true, email: true } },
					name: true,
				},
			},
			attendances: {
				select: {
					member: { select: { name: true } },
					date: true,
					inChurch: true,
					inService: true,
					inMeeting: true,
					memberId: true,
				},
				orderBy: { member: { name: 'asc' } },
			},
		},
		take,
		skip: (page - 1) * take,
		orderBy: { createdAt: 'desc' },
	})
}

function getManagedDepartment(userId: string) {
	return prisma.department.findFirst({
		where: { managerId: userId },
		select: {
			id: true,
			name: true,
			members: {
				where: { deletedAt: null },
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
				},
			},
			services: {
				select: {
					id: true,
					from: true,
					to: true,
				},
			},
		},
	})
}

function getManagedTribe(userId: string) {
	return prisma.tribe.findFirst({
		where: { managerId: userId },
		select: {
			id: true,
			name: true,
			members: {
				where: { deletedAt: null },
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
				},
			},
			services: {
				select: {
					id: true,
					from: true,
					to: true,
				},
			},
		},
	})
}

function getManagedHonorFamily(userId: string) {
	return prisma.honorFamily.findFirst({
		where: { managerId: userId },
		select: {
			id: true,
			name: true,
			members: {
				where: { deletedAt: null },
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
				},
			},
		},
	})
}

async function getCurrentUserManagedEntities(
	currentUser: User,
): Promise<ManagedEntities> {
	const [tribe, department, honorFamily] = await Promise.all([
		currentUser.roles.includes(Role.TRIBE_MANAGER)
			? getManagedTribe(currentUser.id)
			: null,
		currentUser.roles.includes(Role.DEPARTMENT_MANAGER)
			? getManagedDepartment(currentUser.id)
			: null,
		currentUser.roles.includes(Role.HONOR_FAMILY_MANAGER)
			? getManagedHonorFamily(currentUser.id)
			: null,
	])

	return { tribe, department, honorFamily }
}
