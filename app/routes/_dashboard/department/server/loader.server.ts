import { type LoaderFunctionArgs, redirect } from '@remix-run/node'
import { prisma } from '~/infrastructures/database/prisma.server'
import { normalizeDate } from '~/utils/date'
import type { z } from 'zod'
import { requireRole } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { Role, type Prisma } from '@prisma/client'
import { paramsSchema } from '../schema'
import { MemberStatus } from '~/shared/enum'
import { parseISO } from 'date-fns'
import {
	prepareDateRanges,
	fetchAttendanceData,
} from '~/utils/attendance.server'
import { getMembersAttendances } from '~/shared/attendance'

const MEMBER_SELECT = {
	id: true,
	name: true,
	phone: true,
	location: true,
	createdAt: true,
	integrationDate: true,
	pictureUrl: true,
	gender: true,
	birthday: true,
	maritalStatus: true,
	isAdmin: true,
} as Prisma.UserSelect

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const user = await requireRole(request, [Role.DEPARTMENT_MANAGER])
	const { churchId, departmentId } = user

	invariant(churchId, 'Church ID is required')
	invariant(departmentId, 'Department ID is required')

	if (departmentId) {
		user.tribeId = null
		user.honorFamilyId = null
	}

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: paramsSchema })

	if (submission.status !== 'success') {
		throw new Error('Invalid search criteria')
	}

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

	const filterOptions = getFilterOptions(value, departmentId, churchId)

	const [department, total, assistants, members, departmentMembers, services] =
		await Promise.all([
			getDepartment(departmentId, churchId),
			getTotalMembersCount(filterOptions.where),
			getAssistants(departmentId, churchId),
			getMembers(filterOptions),
			getAllDepartmentMembers(departmentId, churchId),
			getServices(departmentId),
		])

	if (!department) return redirect('/dashboard')

	const memberIds = members.map(m => m.id)
	const { allAttendances, previousAttendances } = await fetchAttendanceData(
		user,
		memberIds,
		fromDate,
		processedToDate,
		previousFrom,
		previousTo,
	)

	const departmentMemberIds = departmentMembers.map(m => m.id)
	const departmentAttendances = await fetchAttendanceData(
		user,
		departmentMemberIds,
		fromDate,
		processedToDate,
		previousFrom,
		previousTo,
	)

	return {
		department: {
			id: department.id,
			name: department.name,
			manager: department.manager,
			createdAt: department.createdAt,
		},
		total,
		assistants,
		departmentMembers: getMembersAttendances(
			departmentMembers,
			currentMonthSundays,
			previousMonthSundays,
			departmentAttendances.allAttendances,
			departmentAttendances.previousAttendances,
		),
		membersAttendances: getMembersAttendances(
			members,
			currentMonthSundays,
			previousMonthSundays,
			allAttendances,
			previousAttendances,
		),
		filterData: value,
		services,
	}
}

async function getDepartment(id: string, churchId: string) {
	return prisma.department.findFirst({
		where: { id, churchId },
		select: {
			id: true,
			name: true,
			manager: {
				select: {
					id: true,
					name: true,
					phone: true,
					location: true,
					createdAt: true,
				},
			},
			createdAt: true,
		},
	})
}

async function getTotalMembersCount(where: Prisma.UserWhereInput) {
	return prisma.user.count({ where })
}

async function getAssistants(departmentId: string, churchId: string) {
	return prisma.user.findMany({
		where: {
			churchId,
			departmentId,
			roles: { has: Role.DEPARTMENT_MANAGER },
			managedDepartment: { isNot: { id: departmentId } },
		},
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			createdAt: true,
			integrationDate: true,
			isAdmin: true,
		},
		orderBy: { name: 'asc' },
	})
}

async function getMembers(filterOptions: ReturnType<typeof getFilterOptions>) {
	const { where, take } = filterOptions
	return prisma.user.findMany({
		where,
		select: MEMBER_SELECT,
		orderBy: { name: 'asc' },
		take,
	})
}

async function getAllDepartmentMembers(departmentId: string, churchId: string) {
	return prisma.user.findMany({
		where: { departmentId, churchId },
		select: MEMBER_SELECT,
		orderBy: { name: 'asc' },
	})
}

async function getServices(departmentId: string) {
	return prisma.service.findMany({
		where: { departmentId },
		select: {
			from: true,
			to: true,
		},
	})
}

function getFilterOptions(
	params: z.infer<typeof paramsSchema>,
	departmentId: string,
	churchId: string,
): { where: Prisma.UserWhereInput; take: number } {
	const { from, to, query, page, take, status } = params

	const contains = `%${query.replace(/ /g, '%')}%`

	const isAll = status === 'ALL'
	const statusEnabled = !!status && !isAll
	const isNew = status === MemberStatus.NEW

	const startDate = normalizeDate(new Date(from), 'start')
	const endDate = normalizeDate(new Date(to), 'end')

	const where: Prisma.UserWhereInput = {
		departmentId,
		churchId,
		...(!statusEnabled && { createdAt: { lte: endDate } }),
		...(statusEnabled
			? {
					createdAt: isNew
						? { gte: startDate, lte: endDate }
						: { lte: startDate },
				}
			: { createdAt: { lte: endDate } }),
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
	}

	return { where, take: page * take }
}

export type LoaderType = typeof loaderFn
