import { type User, type Prisma, AttendanceReportEntity } from '@prisma/client'
import { startOfMonth, subMonths, endOfMonth } from 'date-fns'
import { getMonthSundays, normalizeDate } from './date'
import { prisma } from './db.server'
import type { MemberFilterOptions } from '~/shared/types'
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

export async function fetchAllEntityMembers(currentUser: User) {
	let whereClause = {}

	if (currentUser.honorFamilyId) {
		whereClause = {
			honorFamilyId: currentUser.honorFamilyId,
		}
	} else if (currentUser.tribeId) {
		whereClause = {
			tribeId: currentUser.tribeId,
		}
	} else if (currentUser.departmentId) {
		whereClause = {
			departmentId: currentUser.departmentId,
		}
	}

	return prisma.user.findMany({
		where: whereClause,
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			createdAt: true,
			integrationDate: true,
		},
		orderBy: { createdAt: 'desc' },
	})
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
	const dateFilter = {
		attendances: {
			every: { date: { gte: fromDate, lte: toDate } },
		},
	}

	const memberFilter = {
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
	}

	if (currentUser.honorFamilyId) {
		return prisma.attendanceReport.findMany({
			where: {
				OR: [
					{
						entity: AttendanceReportEntity.HONOR_FAMILY,
						honorFamilyId: currentUser.honorFamilyId,
						...dateFilter,
					},
					{
						entity: {
							in: [
								AttendanceReportEntity.TRIBE,
								AttendanceReportEntity.DEPARTMENT,
							],
						},
						OR: [
							{
								entity: AttendanceReportEntity.TRIBE,
								tribe: {
									members: {
										some: {
											honorFamilyId: currentUser.honorFamilyId,
										},
									},
								},
							},
							{
								entity: AttendanceReportEntity.DEPARTMENT,
								department: {
									members: {
										some: {
											honorFamilyId: currentUser.honorFamilyId,
										},
									},
								},
							},
						],
						...dateFilter,
					},
				],
			},
			include: memberFilter,
		})
	}

	return prisma.attendanceReport.findMany({
		where: {
			...(currentUser.tribeId && {
				entity: AttendanceReportEntity.TRIBE,
				tribeId: currentUser.tribeId,
			}),
			...(currentUser.departmentId && {
				entity: AttendanceReportEntity.DEPARTMENT,
				departmentId: currentUser.departmentId,
			}),
			...dateFilter,
		},
		include: memberFilter,
	})
}
export function getDateFilterOptions(options: MemberFilterOptions) {
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
