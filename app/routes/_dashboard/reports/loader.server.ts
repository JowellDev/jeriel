import { type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { filterSchema, type MemberFilterOptions } from './schema'
import type { Prisma } from '@prisma/client'
import { prisma } from '~/infrastructures/database/prisma.server'
import { requireUser } from '~/utils/auth.server'
import { normalizeDate } from '~/utils/date'
import type {
	AttendanceConflicts,
	MemberWithAttendancesConflicts,
} from './model'

const TRACKING_INCLUDE = {
	tribe: { select: { manager: { select: { name: true, phone: true } }, name: true } },
	department: { select: { manager: { select: { name: true, phone: true } }, name: true } },
	honorFamily: { select: { manager: { select: { name: true, phone: true } }, name: true } },
} as const

const REPORTS_INCLUDE = {
	tribe: { select: { manager: { select: { name: true, email: true } }, name: true } },
	department: { select: { manager: { select: { name: true, email: true } }, name: true } },
	honorFamily: { select: { manager: { select: { name: true, email: true } }, name: true } },
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
} as const

function buildConflictsWhere(churchId: string, query: string): Prisma.UserWhereInput {
	return {
		churchId,
		attendances: { some: { hasConflict: true } },
		name: { contains: query, mode: 'insensitive' },
		NOT: { isActive: false, deletedAt: { not: null } },
	}
}

async function fetchTrackingData(churchId: string, filterData: MemberFilterOptions) {
	const where = getTrackingFilterOptions(filterData, churchId)
	const skip = (filterData.page - 1) * filterData.take
	const [reportTrackings, total] = await Promise.all([
		prisma.reportTracking.findMany({
			where,
			include: TRACKING_INCLUDE,
			skip,
			take: filterData.take,
			orderBy: { createdAt: 'desc' },
		}),
		prisma.reportTracking.count({ where }),
	])
	return { reportTrackings, total }
}

async function fetchConflictsData(churchId: string, filterData: MemberFilterOptions) {
	const where = buildConflictsWhere(churchId, filterData.query)
	const skip = (filterData.page - 1) * filterData.take
	const [membersWithConflicts, total] = await Promise.all([
		prisma.user.findMany({
			where,
			select: {
				id: true,
				name: true,
				createdAt: true,
				attendances: {
					where: { hasConflict: true },
					select: {
						date: true,
						inChurch: true,
						id: true,
						hasConflict: true,
						report: {
							select: {
								entity: true,
								tribe: { select: { name: true } },
								department: { select: { name: true } },
							},
						},
					},
				},
			},
			skip,
			take: filterData.take,
		}),
		prisma.user.count({ where }),
	])
	return { membersWithConflicts, total }
}

async function fetchReportsData(churchId: string, filterData: MemberFilterOptions) {
	const where = getReportsFilterOptions(filterData, churchId)
	const skip = (filterData.page - 1) * filterData.take
	const [attendanceReports, total] = await Promise.all([
		prisma.attendanceReport.findMany({
			where,
			include: REPORTS_INCLUDE,
			orderBy: { createdAt: 'desc' },
			skip,
			take: filterData.take,
		}),
		prisma.attendanceReport.count({ where }),
	])
	return { attendanceReports, total }
}

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	invariant(currentUser.churchId, 'Church ID is required')

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: filterSchema })
	invariant(submission.status === 'success', 'invalid criteria')

	const { status, ...filterData } = submission.value
	const filterType = url.searchParams.get('filterType') ?? 'reports'

	if (filterType === 'tracking') {
		const { reportTrackings, total } = await fetchTrackingData(currentUser.churchId, { status, ...filterData })
		return { attendanceReports: [], reportTrackings, membersWithAttendancesConflicts: [], filterData, total } as const
	}

	if (filterType === 'conflicts') {
		const { membersWithConflicts, total } = await fetchConflictsData(currentUser.churchId, filterData)
		return { attendanceReports: [], reportTrackings: [], membersWithAttendancesConflicts: groupMemberConflictsByDate(membersWithConflicts), filterData, total } as const
	}

	const { attendanceReports, total } = await fetchReportsData(currentUser.churchId, filterData)
	return { attendanceReports, reportTrackings: [], membersWithAttendancesConflicts: [], filterData, total } as const
}

export type LoaderType = typeof loaderFn

type FormattedFilterOptions = {
	[K in keyof MemberFilterOptions]?: MemberFilterOptions[K] | undefined
}

function formatOptions(options: MemberFilterOptions): FormattedFilterOptions {
	const filterOptions: FormattedFilterOptions = {}
	for (const [key, value] of Object.entries(options)) {
		filterOptions[key as keyof MemberFilterOptions] =
			value === undefined || value === null ? undefined
			: value.toString() === 'ALL' ? undefined
			: (value as never)
	}
	return filterOptions
}

function buildEntitySearchCondition(entity: string, searchTerm: string) {
	return {
		[entity]: {
			OR: [
				{ name: { contains: searchTerm, mode: 'insensitive' as const } },
				{ manager: { name: { contains: searchTerm, mode: 'insensitive' as const } } },
				{ manager: { phone: { contains: searchTerm, mode: 'insensitive' as const } } },
			],
		},
	}
}

function createSearchConditions(searchTerm: string) {
	if (!searchTerm || searchTerm.trim() === '') return undefined
	return ['tribe', 'department', 'honorFamily'].map(entity =>
		buildEntitySearchCondition(entity, searchTerm),
	)
}

function createBaseFilterConditions(filterOptions: MemberFilterOptions, params: any) {
	const { tribeId, departmentId, honorFamilyId } = params
	const { to, from, entityType } = filterOptions
	const startDate = from === 'null' ? undefined : normalizeDate(new Date(from), 'start')
	const endDate = to === 'null' ? undefined : normalizeDate(new Date(to), 'end')
	return {
		...(entityType === 'TRIBE' && tribeId && { tribeId }),
		...(entityType === 'DEPARTMENT' && departmentId && { departmentId }),
		...(entityType === 'HONOR_FAMILY' && honorFamilyId && { honorFamilyId }),
		...((startDate || endDate) && { createdAt: { gte: startDate, lte: endDate } }),
	}
}

function getTrackingFilterOptions(
	filterOptions: MemberFilterOptions,
	churchId: string,
): Prisma.ReportTrackingWhereInput {
	const params = formatOptions(filterOptions)
	const { status, entityType } = filterOptions
	const churchFilter: Prisma.ReportTrackingWhereInput = {
		OR: [{ tribe: { churchId } }, { department: { churchId } }, { honorFamily: { churchId } }],
	}
	const searchConditions = createSearchConditions(filterOptions.query)
	return {
		...createBaseFilterConditions(filterOptions, params),
		...(entityType && entityType !== 'ALL' && { entity: entityType as any }),
		...(status === 'SUBMITTED' && { submittedAt: { not: null } }),
		...(status === 'NOT_SUBMITTED' && { submittedAt: null }),
		AND: [churchFilter, ...(searchConditions ? [{ OR: searchConditions }] : [])],
	}
}

function getReportsFilterOptions(
	filterOptions: MemberFilterOptions,
	churchId: string,
): Prisma.AttendanceReportWhereInput {
	const params = formatOptions(filterOptions)
	const { entityType } = filterOptions
	const churchFilter: Prisma.AttendanceReportWhereInput = {
		OR: [{ tribe: { churchId } }, { department: { churchId } }, { honorFamily: { churchId } }],
	}
	const searchConditions = createSearchConditions(filterOptions.query)
	return {
		...createBaseFilterConditions(filterOptions, params),
		...(entityType && entityType !== 'ALL' && { entity: entityType as any }),
		AND: [churchFilter, ...(searchConditions ? [{ OR: searchConditions }] : [])],
	}
}

function groupAttendancesByDate(
	attendances: AttendanceConflicts[],
): Record<string, AttendanceConflicts[]> {
	return attendances.reduce(
		(acc, attendance) => {
			const date = new Date(attendance.date).toISOString().split('T')[0]
			if (!acc[date]) acc[date] = []
			acc[date].push(attendance)
			return acc
		},
		{} as Record<string, AttendanceConflicts[]>,
	)
}

function groupMemberConflictsByDate(
	members: MemberWithAttendancesConflicts[],
): MemberWithAttendancesConflicts[] {
	const grouped: MemberWithAttendancesConflicts[] = []
	for (const member of members) {
		const byDate = groupAttendancesByDate(member.attendances)
		Object.entries(byDate)
			.sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
			.forEach(([_, dateAttendances]) => {
				grouped.push({ id: member.id, name: member.name, createdAt: member.createdAt, attendances: dateAttendances })
			})
	}
	return grouped
}
