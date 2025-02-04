import { type LoaderFunctionArgs, json, redirect } from '@remix-run/node'
import { prisma } from '~/utils/db.server'
import {
	getCurrentOrPreviousSunday,
	getMonthSundays,
	hasActiveServiceForDate,
	normalizeDate,
} from '~/utils/date'
import type { z } from 'zod'
import { requireRole } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { Role, type Prisma } from '@prisma/client'
import { paramsSchema } from './schema'
import { MemberStatus } from '~/shared/enum'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	const { churchId, departmentId } = await requireRole(request, [
		Role.DEPARTMENT_MANAGER,
	])

	invariant(churchId, 'Church ID is required')
	invariant(departmentId, 'Department ID is required')

	const currentDay = getCurrentOrPreviousSunday()

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: paramsSchema })

	if (submission.status !== 'success') {
		throw new Error('Invalid search criteria')
	}

	const { value } = submission

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

	const hasActiveService = hasActiveServiceForDate(
		currentDay,
		services.map(s => ({
			from: new Date(s.from),
			to: new Date(s.to),
		})),
	)

	return json({
		department: {
			id: department.id,
			name: department.name,
			manager: department.manager,
			createdAt: department.createdAt,
		},
		total,
		assistants,
		departmentMembers,
		membersAttendances: getMembersAttendances(members),
		filterData: value,
		currentDay,
		hasActiveService,
	})
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
		take,
	})
}

async function getAllDepartmentMembers(departmentId: string, churchId: string) {
	return prisma.user.findMany({
		where: { departmentId, churchId },
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
async function getServices(departmentId: string) {
	return prisma.service.findMany({
		where: { departmentId },
		select: {
			from: true,
			to: true,
		},
	})
}

function getMembersAttendances(members: Member[]): MemberMonthlyAttendances[] {
	const currentMonthSundays = getMonthSundays(new Date())
	return members.map(member => ({
		...member,
		previousMonthAttendanceResume: null,
		currentMonthAttendanceResume: null,
		currentMonthAttendances: currentMonthSundays.map(sunday => ({
			sunday,
			isPresent: null,
		})),
	}))
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
