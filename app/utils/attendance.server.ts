import { type User, type Prisma, AttendanceReportEntity } from '@prisma/client'
import { startOfMonth, subMonths, endOfMonth } from 'date-fns'
import { getMonthSundays } from './date'
import { prisma } from './db.server'
import type { MemberFilterOptions } from '~/shared/types'

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
				where: {
					...(currentUser.tribeId && { tribeId: currentUser.tribeId }),
					...(currentUser.departmentId && {
						departmentId: currentUser.departmentId,
					}),
				},
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
	value: MemberFilterOptions,
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
		}),
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
			...(currentUser.tribeId && { entity: AttendanceReportEntity.TRIBE }),
			...(currentUser.departmentId && {
				entity: AttendanceReportEntity.DEPARTMENT,
			}),
			...(currentUser.honorFamilyId && {
				entity: AttendanceReportEntity.HONOR_FAMILY,
			}),
			...(currentUser.tribeId && { tribeId: currentUser.tribeId }),
			...(currentUser.departmentId && {
				departmentId: currentUser.departmentId,
			}),
			...(currentUser.honorFamilyId && {
				honorFamilyId: currentUser.honorFamilyId,
			}),
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
