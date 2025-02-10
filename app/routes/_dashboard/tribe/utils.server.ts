import { type User, type Prisma, AttendanceReportEntity } from '@prisma/client'
import { startOfMonth, subMonths, endOfMonth } from 'date-fns'
import type { Member } from '~/models/member.model'
import { getMonthSundays, normalizeDate } from '~/utils/date'
import { prisma } from '~/utils/db.server'
import { type FilterSchema } from './schema'
import type { MemberFilterOptions } from './types'
import { MemberStatus } from '~/shared/enum'

export function prepareDateRanges(toDate: Date) {
	const previousFrom = startOfMonth(subMonths(toDate, 1))
	const previousTo = endOfMonth(subMonths(toDate, 1))

	const currentMonthSundays = getMonthSundays(startOfMonth(toDate))
	const previousMonthSundays = getMonthSundays(previousTo)

	return {
		toDate,
		currentMonthSundays,
		previousMonthSundays,
		previousFrom,
		previousTo,
	}
}

export async function fetchAttendanceData(
	currentUser: User,
	memberIds: string[],
	fromDate: Date,
	toDate: Date,
	previousFrom: Date,
	previousTo: Date,
) {
	const [services, attendanceReports, previousAttendanceReports] =
		await Promise.all([
			prisma.service.findMany({
				where: { tribeId: currentUser.tribeId },
				select: { from: true, to: true },
			}),
			fetchAttendanceReports(currentUser, memberIds, fromDate, toDate),
			fetchAttendanceReports(currentUser, memberIds, previousFrom, previousTo),
		])

	const allAttendances = attendanceReports.flatMap(report => report.attendances)
	const previousAttendances = previousAttendanceReports.flatMap(
		report => report.attendances,
	)

	return { services, allAttendances, previousAttendances }
}

export function getMemberQuery(
	where: Prisma.UserWhereInput,
	value: FilterSchema,
) {
	return [
		prisma.user.count({ where }),
		prisma.user.findMany({
			where,
			select: {
				id: true,
				name: true,
				phone: true,
				location: true,
				createdAt: true,
				integrationDate: true,
			},
			orderBy: { createdAt: 'desc' },
			take: value.page * value.take,
		}) as Promise<Member[]>,
	]
}

function fetchAttendanceReports(
	currentUser: User,
	memberIds: string[],
	fromDate: Date,
	toDate: Date,
) {
	return prisma.attendanceReport.findMany({
		where: {
			entity: AttendanceReportEntity.TRIBE,
			tribeId: currentUser.tribeId,
			attendances: {
				every: { date: { gte: fromDate, lte: toDate } },
			},
		},
		include: {
			attendances: {
				where: { memberId: { in: memberIds } },
				select: {
					memberId: true,
					date: true,
					inChurch: true,
					inService: true,
					inMeeting: true,
					hasConflict: true,
				},
			},
		},
	})
}

export function getFilterOptions(
	params: MemberFilterOptions,
	currentUser: User,
): Prisma.UserWhereInput {
	const contains = `%${params.query.replace(/ /g, '%')}%`

	return {
		id: { not: currentUser.id },
		churchId: currentUser.churchId,
		tribeId: currentUser.tribeId,
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
		...getDateFilterOptions(params),
	}
}

function getDateFilterOptions(options: MemberFilterOptions) {
	const { status, to, from } = options

	const isAll = status === 'ALL'
	const statusEnabled = !!status && !isAll
	const isNew = status === MemberStatus.NEW

	const startDate = normalizeDate(new Date(from), 'start')
	const endDate = normalizeDate(new Date(to), 'end')

	return {
		...(!statusEnabled && { createdAt: { lte: endDate } }),
		...(statusEnabled
			? {
					createdAt: isNew
						? { gte: startDate, lte: endDate }
						: { lte: startDate },
				}
			: { createdAt: { lte: endDate } }),
	}
}

export function formatOptions(options: MemberFilterOptions) {
	const filterOptions: any = {}

	for (const [key, value] of Object.entries(options)) {
		filterOptions[key] = value.toLocaleString() === 'ALL' ? undefined : value
	}

	return filterOptions
}
