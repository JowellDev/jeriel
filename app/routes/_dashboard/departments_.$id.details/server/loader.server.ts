import { type LoaderFunctionArgs, redirect } from '@remix-run/node'
import { prisma } from '~/infrastructures/database/prisma.server'
import type { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import type { Member } from '~/models/member.model'
import { Role, type Prisma } from '@prisma/client'
import { paramsSchema } from '../schema'
import {
	fetchAttendanceData,
	formatOptions,
	getDateFilterOptions,
	getMemberQuery,
	prepareDateRanges,
} from '~/helpers/attendance.server'
import { parseISO } from 'date-fns'
import { getMembersAttendances } from '~/shared/attendance'

function parseLoaderParams(
	request: Request,
	departmentId: string,
	churchId: string,
) {
	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: paramsSchema })
	if (submission.status !== 'success')
		throw new Error('Invalid search criteria')

	const { value } = submission
	const fromDate = parseISO(value.from)
	const toDate = parseISO(value.to)
	const dateRanges = prepareDateRanges(toDate)
	const where = getFilterOptions(
		formatOptions(value) as any,
		departmentId,
		churchId,
	)

	return { value, fromDate, toDate, dateRanges, where }
}

async function fetchDepartmentPageData(
	departmentId: string,
	churchId: string,
	where: Prisma.UserWhereInput,
	value: z.infer<typeof paramsSchema>,
) {
	const memberQuery = getMemberQuery(where, value)
	const [department, assistants, total, membersStats, membersCount] =
		await Promise.all([
			getDepartment(departmentId, churchId),
			getAssistants(departmentId, churchId),
			memberQuery[0],
			memberQuery[1],
			prisma.user.count({
				where: {
					departmentId,
					NOT: { isActive: false, deletedAt: { not: null } },
				},
			}),
		])
	return { department, assistants, total, membersStats, membersCount }
}

async function buildMembersWithAttendances(
	currentUser: Awaited<ReturnType<typeof requireUser>>,
	members: Member[],
	fromDate: Date,
	dateRanges: ReturnType<typeof prepareDateRanges>,
) {
	const { allAttendances, previousAttendances } = await fetchAttendanceData(
		currentUser,
		members.map(m => m.id),
		fromDate,
		dateRanges.toDate,
		dateRanges.previousFrom,
		dateRanges.previousTo,
	)
	return getMembersAttendances(
		members,
		dateRanges.currentMonthSundays,
		dateRanges.previousMonthSundays,
		allAttendances,
		previousAttendances,
	)
}

function buildLoaderResult(
	department: NonNullable<Awaited<ReturnType<typeof getDepartment>>>,
	total: number,
	membersCount: number,
	assistants: Awaited<ReturnType<typeof getAssistants>>,
	membersWithAttendances: Awaited<
		ReturnType<typeof buildMembersWithAttendances>
	>,
	filterData: z.infer<typeof paramsSchema>,
) {
	return {
		department: {
			id: department.id,
			name: department.name,
			manager: department.manager,
			createdAt: department.createdAt,
		},
		total,
		membersCount,
		assistants,
		members: membersWithAttendances,
		filterData,
	}
}

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	const { id: departmentId } = params

	invariant(currentUser.churchId, 'Church ID is required')
	invariant(departmentId, 'Department ID is required')

	const { value, fromDate, dateRanges, where } = parseLoaderParams(
		request,
		departmentId,
		currentUser.churchId,
	)
	const { department, assistants, total, membersStats, membersCount } =
		await fetchDepartmentPageData(
			departmentId,
			currentUser.churchId,
			where,
			value,
		)

	if (!department) return redirect('/departments')

	currentUser.departmentId = department.id
	const members = membersStats as Member[]
	const membersWithAttendances = await buildMembersWithAttendances(
		currentUser,
		members,
		fromDate,
		dateRanges,
	)
	return buildLoaderResult(
		department,
		total as number,
		membersCount,
		assistants,
		membersWithAttendances,
		value,
	)
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
					email: true,
					phone: true,
					location: true,
					createdAt: true,
				},
			},
			createdAt: true,
		},
	})
}

async function getAssistants(departmentId: string, churchId: string) {
	return prisma.user.findMany({
		where: {
			churchId,
			departmentId,
			roles: { has: Role.DEPARTMENT_MANAGER },
			managedDepartment: { isNot: { id: departmentId } },
			NOT: { isActive: false, deletedAt: { not: null } },
		},
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
			location: true,
			createdAt: true,
			integrationDate: true,
			gender: true,
			birthday: true,
			maritalStatus: true,
			pictureUrl: true,
			isAdmin: true,
		},
	})
}

function getFilterOptions(
	params: z.infer<typeof paramsSchema>,
	departmentId: string,
	churchId: string,
): Prisma.UserWhereInput {
	const contains = `%${params.query.replace(/ /g, '%')}%`
	return {
		departmentId,
		churchId,
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
		NOT: { isActive: false, deletedAt: { not: null } },
		...getDateFilterOptions(params),
	}
}

export type LoaderType = typeof loaderFn
