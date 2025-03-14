import { type LoaderFunctionArgs, json, redirect } from '@remix-run/node'
import { prisma } from '~/utils/db.server'
import type { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import type { Member } from '~/models/member.model'
import { Role, type Prisma } from '@prisma/client'
import { paramsSchema } from './schema'
import {
	fetchAttendanceData,
	formatOptions,
	getDateFilterOptions,
	getMemberQuery,
	prepareDateRanges,
} from '~/utils/attendance.server'
import { parseISO } from 'date-fns'
import { getMembersAttendances } from '~/shared/attendance'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	const { id: departmentId } = params

	invariant(currentUser.churchId, 'Church ID is required')
	invariant(departmentId, 'Department ID is required')

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

	const where = getFilterOptions(
		formatOptions(value),
		departmentId,
		currentUser.churchId,
	)

	const memberQuery = getMemberQuery(where, value)

	const [department, assistants, total, membersStats, membersCount] =
		await Promise.all([
			getDepartment(departmentId, currentUser.churchId),
			getAssistants(departmentId, currentUser.churchId),
			memberQuery[0],
			memberQuery[1],
			prisma.user.count({ where: { departmentId } }),
		])

	const members = membersStats as Member[]
	const memberIds = members.map(m => m.id)

	if (!department) return redirect('/departments')

	currentUser.departmentId = department.id

	const { allAttendances, previousAttendances } = await fetchAttendanceData(
		currentUser,
		memberIds,
		fromDate,
		processedToDate,
		previousFrom,
		previousTo,
	)

	return json({
		department: {
			id: department.id,
			name: department.name,
			manager: department.manager,
			createdAt: department.createdAt,
		},
		total: total as number,
		membersCount,
		assistants,
		members: getMembersAttendances(
			members,
			currentMonthSundays,
			previousMonthSundays,
			allAttendances,
			previousAttendances,
		),
		filterData: value,
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
		...getDateFilterOptions(params),
	}
}

export type LoaderType = typeof loaderFn
