import { type User, type Prisma, AttendanceReportEntity } from '@prisma/client'
import { startOfMonth, subMonths, endOfMonth, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { MemberFilterOptions, AttendanceData } from '~/shared/types'
import { prisma } from '~/infrastructures/database/prisma.server'
import { getMonthSundays, normalizeDate } from '~/utils/date'
import { MemberStatus } from '~/shared/enum'

export interface AttendanceStats {
	veryRegular: number
	regular: number
	littleRegular: number
	absent: number
}

export function formatAttendanceData(
	data: {
		totalMembers: number
		stats: AttendanceStats
		memberStats: {
			newMembers: number
			oldMembers: number
		}
	},
	date: Date,
): AttendanceData {
	const total = data.totalMembers

	const veryRegularPercentage =
		total > 0 ? Math.round((data.stats.veryRegular / total) * 100) : 0
	const regularPercentage =
		total > 0 ? Math.round((data.stats.regular / total) * 100) : 0
	const littleRegularPercentage =
		total > 0 ? Math.round((data.stats.littleRegular / total) * 100) : 0
	const absentPercentage =
		total > 0 ? Math.round((data.stats.absent / total) * 100) : 0

	const dateLabel = `${format(date, 'MMMM yyyy', { locale: fr })}`

	return {
		total,
		date: dateLabel,
		stats: [
			{
				type: 'Très régulier',
				percentage: `${veryRegularPercentage}%`,
				color: 'bg-[#3BC9BF]',
				lottieData: null,
			},
			{
				type: 'Régulier',
				percentage: `${regularPercentage}%`,
				color: 'bg-[#E9C724]',
				lottieData: null,
			},
			{
				type: 'Peu régulier',
				percentage: `${littleRegularPercentage}%`,
				color: 'bg-[#F68D2B]',
				lottieData: null,
			},
			{
				type: 'Absent',
				percentage: `${absentPercentage}%`,
				color: 'bg-[#EA503D]',
				lottieData: null,
			},
		],
		memberStats: [
			{
				name: 'Nouveaux',
				value: data.memberStats.newMembers,
				color: '#3BC9BF',
			},
			{ name: 'Anciens', value: data.memberStats.oldMembers, color: '#F68D2B' },
		],
	}
}

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

	const allAttendances = attendanceReports?.flatMap(
		report => report.attendances,
	)
	const previousAttendances = previousAttendanceReports?.flatMap(
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
				email: true,
				phone: true,
				location: true,
				createdAt: true,
				integrationDate: true,
			},
			orderBy: { name: 'asc' },
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

	if (currentUser.honorFamilyId || currentUser.roles.includes('ADMIN')) {
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

	if (currentUser.tribeId || currentUser.roles.includes('ADMIN')) {
		return prisma.attendanceReport.findMany({
			where: {
				entity: AttendanceReportEntity.TRIBE,
				tribeId: currentUser.tribeId,

				...dateFilter,
			},
			include: memberFilter,
		})
	}

	if (currentUser.departmentId || currentUser.roles.includes('ADMIN')) {
		return prisma.attendanceReport.findMany({
			where: {
				entity: AttendanceReportEntity.DEPARTMENT,
				departmentId: currentUser.departmentId,
				...dateFilter,
			},
			include: memberFilter,
		})
	}
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
