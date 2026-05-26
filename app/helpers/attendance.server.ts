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

function toPercentage(count: number, total: number): number {
	return total > 0 ? Math.round((count / total) * 100) : 0
}

function buildStatItems(stats: AttendanceStats, total: number) {
	return [
		{
			type: 'Très régulier',
			percentage: `${toPercentage(stats.veryRegular, total)}%`,
			color: 'bg-[#3BC9BF]',
			lottieData: null,
		},
		{
			type: 'Régulier',
			percentage: `${toPercentage(stats.regular, total)}%`,
			color: 'bg-[#E9C724]',
			lottieData: null,
		},
		{
			type: 'Peu régulier',
			percentage: `${toPercentage(stats.littleRegular, total)}%`,
			color: 'bg-[#F68D2B]',
			lottieData: null,
		},
		{
			type: 'Absent',
			percentage: `${toPercentage(stats.absent, total)}%`,
			color: 'bg-[#EA503D]',
			lottieData: null,
		},
	]
}

function buildMemberStatItems(memberStats: {
	newMembers: number
	oldMembers: number
}) {
	return [
		{ name: 'Nouveaux', value: memberStats.newMembers, color: '#3BC9BF' },
		{ name: 'Anciens', value: memberStats.oldMembers, color: '#F68D2B' },
	]
}

export function formatAttendanceData(
	data: {
		totalMembers: number
		stats: AttendanceStats
		memberStats: { newMembers: number; oldMembers: number }
	},
	date: Date,
): AttendanceData {
	return {
		total: data.totalMembers,
		date: format(date, 'MMMM yyyy', { locale: fr }),
		stats: buildStatItems(data.stats, data.totalMembers),
		memberStats: buildMemberStatItems(data.memberStats),
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

function buildEntityMemberWhereClause(currentUser: User) {
	if (currentUser.honorFamilyId)
		return { honorFamilyId: currentUser.honorFamilyId, isActive: true }

	if (currentUser.tribeId)
		return { tribeId: currentUser.tribeId, isActive: true }

	if (currentUser.departmentId)
		return { departmentId: currentUser.departmentId, isActive: true }

	return {}
}

export async function fetchAllEntityMembers(currentUser: User) {
	return prisma.user.findMany({
		where: buildEntityMemberWhereClause(currentUser),
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

async function fetchEntityServices(currentUser: User) {
	return prisma.service.findMany({
		where: {
			...(currentUser.tribeId && { tribeId: currentUser.tribeId }),
			...(currentUser.departmentId && {
				departmentId: currentUser.departmentId,
			}),
		},
		select: { from: true, to: true },
	})
}

function flattenAttendances(reports: any[] | undefined) {
	return reports?.flatMap(report => report.attendances)
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
			fetchEntityServices(currentUser),
			fetchAttendanceReports(currentUser, memberIds, fromDate, toDate),
			fetchAttendanceReports(currentUser, memberIds, previousFrom, previousTo),
		])

	return {
		services,
		allAttendances: flattenAttendances(attendanceReports),
		previousAttendances: flattenAttendances(previousAttendanceReports),
	}
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

function buildReportDateFilter(fromDate: Date, toDate: Date) {
	return { attendances: { every: { date: { gte: fromDate, lte: toDate } } } }
}

function buildMemberAttendanceInclude(memberIds: string[]) {
	return {
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
}

function buildHonorFamilyCrossEntityFilter(honorFamilyId: string) {
	return {
		entity: {
			in: [AttendanceReportEntity.TRIBE, AttendanceReportEntity.DEPARTMENT],
		},
		OR: [
			{
				entity: AttendanceReportEntity.TRIBE,
				tribe: { members: { some: { honorFamilyId } } },
			},
			{
				entity: AttendanceReportEntity.DEPARTMENT,
				department: { members: { some: { honorFamilyId } } },
			},
		],
	}
}

async function fetchHonorFamilyReports(
	currentUser: User,
	dateFilter: any,
	memberInclude: any,
) {
	return prisma.attendanceReport.findMany({
		where: {
			OR: [
				{
					entity: AttendanceReportEntity.HONOR_FAMILY,
					honorFamilyId: currentUser.honorFamilyId,
					...dateFilter,
				},
				{
					...buildHonorFamilyCrossEntityFilter(currentUser.honorFamilyId!),
					...dateFilter,
				},
			],
		},
		include: memberInclude,
	})
}

async function fetchTribeReports(
	currentUser: User,
	dateFilter: any,
	memberInclude: any,
) {
	return prisma.attendanceReport.findMany({
		where: {
			entity: AttendanceReportEntity.TRIBE,
			tribeId: currentUser.tribeId,
			...dateFilter,
		},
		include: memberInclude,
	})
}

async function fetchDepartmentReports(
	currentUser: User,
	dateFilter: any,
	memberInclude: any,
) {
	return prisma.attendanceReport.findMany({
		where: {
			entity: AttendanceReportEntity.DEPARTMENT,
			departmentId: currentUser.departmentId,
			...dateFilter,
		},
		include: memberInclude,
	})
}

function fetchAttendanceReports(
	currentUser: User,
	memberIds: string[],
	fromDate: Date,
	toDate: Date,
) {
	const dateFilter = buildReportDateFilter(fromDate, toDate)
	const memberInclude = buildMemberAttendanceInclude(memberIds)

	if (currentUser.honorFamilyId || currentUser.roles.includes('ADMIN')) {
		return fetchHonorFamilyReports(currentUser, dateFilter, memberInclude)
	}

	if (currentUser.tribeId || currentUser.roles.includes('ADMIN')) {
		return fetchTribeReports(currentUser, dateFilter, memberInclude)
	}

	if (currentUser.departmentId || currentUser.roles.includes('ADMIN')) {
		return fetchDepartmentReports(currentUser, dateFilter, memberInclude)
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
		...(statusEnabled
			? {
					createdAt: isNew
						? { gte: startDate, lte: endDate }
						: { lte: startDate },
				}
			: { createdAt: { lte: endDate } }),
	}
}

type FormattedFilterOptions = {
	[K in keyof MemberFilterOptions]?: MemberFilterOptions[K] | undefined
}

export function formatOptions(
	options: MemberFilterOptions,
): FormattedFilterOptions {
	const filterOptions: FormattedFilterOptions = {}

	for (const [key, value] of Object.entries(options)) {
		if (value.toLocaleString() === 'ALL') {
			filterOptions[key as keyof MemberFilterOptions] = undefined
		} else {
			filterOptions[key as keyof MemberFilterOptions] = value as never
		}
	}

	return filterOptions
}
