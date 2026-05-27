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
} from '~/helpers/attendance.server'
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

function parseLoaderParams(request: Request) {
	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: paramsSchema })
	if (submission.status !== 'success')
		throw new Error('Invalid search criteria')
	const { value } = submission
	const fromDate = parseISO(value.from)
	const toDate = parseISO(value.to)
	const dateRanges = prepareDateRanges(toDate)
	return { value, fromDate, dateRanges }
}

async function fetchDepartmentPageData(
	departmentId: string,
	churchId: string,
	filterOptions: ReturnType<typeof getFilterOptions>,
) {
	return Promise.all([
		getDepartment(departmentId, churchId),
		getTotalMembersCount(filterOptions.where),
		getAssistants(departmentId, churchId),
		getMembers(filterOptions),
		getAllDepartmentMembers(departmentId, churchId),
		getServices(departmentId),
	])
}

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const user = await requireRole(request, [Role.DEPARTMENT_MANAGER])
	const { churchId, departmentId } = user

	invariant(churchId, 'Church ID is required')
	invariant(departmentId, 'Department ID is required')

	user.tribeId = null
	user.honorFamilyId = null

	const { value, fromDate, dateRanges } = parseLoaderParams(request)
	const filterOptions = getFilterOptions(value, departmentId, churchId)

	const [department, total, assistants, members, departmentMembers, services] =
		await fetchDepartmentPageData(departmentId, churchId, filterOptions)

	if (!department) return redirect('/dashboard')

	const memberIds = members.map(m => m.id)
	const [memberAttendances, allMemberAttendances] = await Promise.all([
		fetchAttendanceData(
			user,
			memberIds,
			fromDate,
			dateRanges.toDate,
			dateRanges.previousFrom,
			dateRanges.previousTo,
		),
		fetchAttendanceData(
			user,
			departmentMembers.map(m => m.id),
			fromDate,
			dateRanges.toDate,
			dateRanges.previousFrom,
			dateRanges.previousTo,
		),
	])

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
			dateRanges.currentMonthSundays,
			dateRanges.previousMonthSundays,
			allMemberAttendances.allAttendances,
			allMemberAttendances.previousAttendances,
		),
		membersAttendances: getMembersAttendances(
			members,
			dateRanges.currentMonthSundays,
			dateRanges.previousMonthSundays,
			memberAttendances.allAttendances,
			memberAttendances.previousAttendances,
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
			deletedAt: null,
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
	return prisma.user.findMany({
		where: filterOptions.where,
		select: MEMBER_SELECT,
		orderBy: { name: 'asc' },
		take: filterOptions.take,
	})
}

async function getAllDepartmentMembers(departmentId: string, churchId: string) {
	return prisma.user.findMany({
		where: { departmentId, churchId, deletedAt: null, isActive: true },
		select: MEMBER_SELECT,
		orderBy: { name: 'asc' },
	})
}

async function getServices(departmentId: string) {
	return prisma.service.findMany({
		where: { departmentId },
		select: { from: true, to: true },
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

	return {
		where: {
			departmentId,
			churchId,
			deletedAt: null,
			isActive: true,
			...(statusEnabled
				? {
						createdAt: isNew
							? { gte: startDate, lte: endDate }
							: { lte: startDate },
					}
				: { createdAt: { lte: endDate } }),
			OR: [
				{ name: { contains, mode: 'insensitive' } },
				{ phone: { contains } },
			],
		},
		take: page * take,
	}
}

export type LoaderType = typeof loaderFn
