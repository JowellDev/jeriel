import { type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { filterSchema, type MemberFilterOptions } from './schema'
import type { Prisma } from '@prisma/client'
import { prisma } from '~/utils/db.server'
import { requireUser } from '~/utils/auth.server'
import { normalizeDate } from '~/utils/date'
import type {
	AttendanceConflicts,
	MemberWithAttendancesConflicts,
} from './model'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	invariant(currentUser.churchId, 'Church ID is required')

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: filterSchema })
	invariant(submission.status === 'success', 'invalid criteria')

	const { status, ...filterData } = submission.value
	const filterType = url.searchParams.get('filterType') ?? 'reports'

	if (filterType === 'tracking') {
		const trackingWhere = getTrackingFilterOptions(
			{
				status,
				...filterData,
			},
			currentUser.churchId,
		)

		const reportTrackings = await prisma.reportTracking.findMany({
			where: trackingWhere,
			include: {
				tribe: {
					select: {
						manager: { select: { name: true, phone: true } },
						name: true,
					},
				},
				department: {
					select: {
						manager: { select: { name: true, phone: true } },
						name: true,
					},
				},
				honorFamily: {
					select: {
						manager: { select: { name: true, phone: true } },
						name: true,
					},
				},
			},
			skip: (filterData.page - 1) * filterData.take,
			take: filterData.take,
			orderBy: { createdAt: 'desc' },
		})

		const totalTracking = await prisma.reportTracking.count({
			where: trackingWhere,
		})

		return {
			attendanceReports: [],
			reportTrackings,
			membersWithAttendancesConflicts: [],
			filterData,
			total: totalTracking,
		} as const
	}

	if (filterType === 'conflicts') {
		const conflictsWhere = {
			churchId: currentUser.churchId,
			attendances: {
				some: {
					hasConflict: true,
				},
			},
			name: { contains: filterData.query, mode: 'insensitive' },
		} satisfies Prisma.UserWhereInput

		const membersWithConflicts = await prisma.user.findMany({
			where: conflictsWhere,
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
			skip: (filterData.page - 1) * filterData.take,
			take: filterData.take,
		})

		const totalConflicts = await prisma.user.count({ where: conflictsWhere })

		return {
			attendanceReports: [],
			reportTrackings: [],
			membersWithAttendancesConflicts:
				groupMemberConflictsByDate(membersWithConflicts),
			filterData,
			total: totalConflicts,
		} as const
	}

	const reportsWhere = getReportsFilterOptions(filterData, currentUser.churchId)

	const [attendanceReports, membersWithAttendancesConflicts] =
		await Promise.all([
			prisma.attendanceReport.findMany({
				where: reportsWhere,
				include: {
					tribe: {
						select: {
							manager: { select: { name: true, phone: true } },
							name: true,
						},
					},
					department: {
						select: {
							manager: { select: { name: true, phone: true } },
							name: true,
						},
					},
					honorFamily: {
						select: {
							manager: { select: { name: true, phone: true } },
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
				skip: (filterData.page - 1) * filterData.take,
				take: filterData.take,
			}),
			prisma.user.findMany({
				where: {
					churchId: currentUser.churchId,
					attendances: { some: { hasConflict: true } },
				},
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
			}),
		])

	const total = await prisma.attendanceReport.count({ where: reportsWhere })

	return {
		attendanceReports,
		reportTrackings: [],
		membersWithAttendancesConflicts: groupMemberConflictsByDate(
			membersWithAttendancesConflicts,
		),
		filterData,
		total,
	} as const
}

export type LoaderType = typeof loaderFn

function formatOptions(options: MemberFilterOptions) {
	const filterOptions: any = {}

	for (const [key, value] of Object.entries(options)) {
		if (value === undefined || value === null) {
			filterOptions[key] = undefined
		} else {
			filterOptions[key] = value.toString() === 'ALL' ? undefined : value
		}
	}

	return filterOptions
}

function createSearchConditions(searchTerm: string) {
	if (!searchTerm || searchTerm.trim() === '') {
		return undefined
	}

	return [
		{
			tribe: {
				OR: [
					{ name: { contains: searchTerm, mode: 'insensitive' as const } },
					{
						manager: {
							name: { contains: searchTerm, mode: 'insensitive' as const },
						},
					},
					{
						manager: {
							phone: { contains: searchTerm, mode: 'insensitive' as const },
						},
					},
				],
			},
		},
		{
			department: {
				OR: [
					{ name: { contains: searchTerm, mode: 'insensitive' as const } },
					{
						manager: {
							name: { contains: searchTerm, mode: 'insensitive' as const },
						},
					},
					{
						manager: {
							phone: { contains: searchTerm, mode: 'insensitive' as const },
						},
					},
				],
			},
		},
		{
			honorFamily: {
				OR: [
					{ name: { contains: searchTerm, mode: 'insensitive' as const } },
					{
						manager: {
							name: { contains: searchTerm, mode: 'insensitive' as const },
						},
					},
					{
						manager: {
							phone: { contains: searchTerm, mode: 'insensitive' as const },
						},
					},
				],
			},
		},
	]
}

function createBaseFilterConditions(
	filterOptions: MemberFilterOptions,
	params: any,
	churchId?: string,
) {
	const { tribeId, departmentId, honorFamilyId } = params
	const { to, from, entityType } = filterOptions

	const startDate =
		from === 'null' ? undefined : normalizeDate(new Date(from), 'start')
	const endDate = normalizeDate(new Date(to), 'end')

	return {
		...(entityType === 'TRIBE' && tribeId && { tribeId }),
		...(entityType === 'DEPARTMENT' && departmentId && { departmentId }),
		...(entityType === 'HONOR_FAMILY' && honorFamilyId && { honorFamilyId }),
		...(tribeId && { tribeId }),
		...(departmentId && { departmentId }),
		...(honorFamilyId && { honorFamilyId }),
		createdAt: { gte: startDate, lte: endDate },
	}
}

function getTrackingFilterOptions(
	filterOptions: MemberFilterOptions,
	churchId: string,
): Prisma.ReportTrackingWhereInput {
	const params = formatOptions(filterOptions)
	const { status } = filterOptions

	const whereCondition: any = {
		...createBaseFilterConditions(filterOptions, params),
		...(status === 'SUBMITTED' && { submittedAt: { not: null } }),
		...(status === 'NOT_SUBMITTED' && { submittedAt: null }),
		// Filter by church through related entities
		OR: [
			{ tribe: { churchId } },
			{ department: { churchId } },
			{ honorFamily: { churchId } },
		],
	}

	const searchConditions = createSearchConditions(filterOptions.query)
	if (searchConditions) {
		// If we have search conditions, combine them with church filter
		whereCondition.AND = [
			{
				OR: [
					{ tribe: { churchId } },
					{ department: { churchId } },
					{ honorFamily: { churchId } },
				],
			},
			{
				OR: searchConditions,
			},
		]
		// Remove the simple OR from whereCondition since we're using AND now
		delete whereCondition.OR
	}

	return whereCondition
}

function getReportsFilterOptions(
	filterOptions: MemberFilterOptions,
	churchId: string,
): Prisma.AttendanceReportWhereInput {
	const params = formatOptions(filterOptions)

	const whereCondition: any = {
		...createBaseFilterConditions(filterOptions, params),
		// Filter by church through related entities
		OR: [
			{ tribe: { churchId } },
			{ department: { churchId } },
			{ honorFamily: { churchId } },
		],
	}

	const searchConditions = createSearchConditions(filterOptions.query)
	if (searchConditions) {
		// If we have search conditions, combine them with church filter
		whereCondition.AND = [
			{
				OR: [
					{ tribe: { churchId } },
					{ department: { churchId } },
					{ honorFamily: { churchId } },
				],
			},
			{
				OR: searchConditions,
			},
		]
		// Remove the simple OR from whereCondition since we're using AND now
		delete whereCondition.OR
	}

	return whereCondition
}

function groupMemberConflictsByDate(
	members: MemberWithAttendancesConflicts[],
): MemberWithAttendancesConflicts[] {
	const groupedMembers: MemberWithAttendancesConflicts[] = []

	members.forEach(member => {
		const attendancesByDate = member.attendances.reduce(
			(acc, attendance) => {
				const date = new Date(attendance.date).toISOString().split('T')[0]
				if (!acc[date]) {
					acc[date] = []
				}
				acc[date].push(attendance)
				return acc
			},
			{} as Record<string, AttendanceConflicts[]>,
		)

		Object.entries(attendancesByDate)
			.sort(
				([dateA], [dateB]) =>
					new Date(dateB).getTime() - new Date(dateA).getTime(),
			)
			.forEach(([_, dateAttendances]) => {
				groupedMembers.push({
					id: member.id,
					name: member.name,
					createdAt: member.createdAt,
					attendances: dateAttendances,
				})
			})
	})

	return groupedMembers
}
