import { type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { prisma } from '~/infrastructures/database/prisma.server'
import { requireUser } from '~/utils/auth.server'
import { normalizeDate } from '~/utils/date'
import { filterSchema } from './schema'
import type { Prisma } from '@prisma/client'
import { Role } from '@prisma/client'

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

	const whereCondition: Prisma.AttendanceReportWhereInput = {
		submitterId: currentUser.id,
	}

	const startDate = filterData.from
		? normalizeDate(new Date(filterData.from), 'start')
		: undefined

	const endDate = normalizeDate(new Date(filterData.to), 'end')

	const { query } = filterData

	const contains = `%${query.replace(/ /g, '%')}%`

	whereCondition.createdAt = {
		gte: startDate,
		lte: endDate,
		...(query && {
			OR: [
				{ tribe: { name: { contains, mode: 'insensitive' } } },
				{ department: { name: { contains, mode: 'insensitive' } } },
				{ honorFamily: { name: { contains, mode: 'insensitive' } } },
			],
		}),
	}

	const [reports, total] = await Promise.all([
		getAttendanceReports(whereCondition, filterData.take, filterData.page),
		prisma.attendanceReport.count({ where: whereCondition }),
	])

	return {
		total,
		reports,
		filterData,
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
			},
		},
		take,
		skip: (page - 1) * take,
		orderBy: { createdAt: 'desc' },
	})
}
