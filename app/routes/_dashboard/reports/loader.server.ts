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

	const filterData = submission.value
	const filterType = url.searchParams.get('filterType') ?? 'reports'

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
			membersWithAttendancesConflicts:
				groupMemberConflictsByDate(membersWithConflicts),
			filterData,
			total: totalConflicts,
		} as const
	}

	const reportsWhere = getFilterOptions(filterData)

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
		membersWithAttendancesConflicts: groupMemberConflictsByDate(
			membersWithAttendancesConflicts,
		),
		filterData,
		total,
	} as const
}

export type LoaderType = typeof loaderFn

function getFilterOptions(
	filterOptions: MemberFilterOptions,
): Prisma.AttendanceReportWhereInput {
	const params = formatOptions(filterOptions)
	const { tribeId, departmentId, honorFamilyId } = params

	const { to, from, entityType } = filterOptions

	const startDate =
		from === 'null' ? undefined : normalizeDate(new Date(from), 'start')

	const endDate = normalizeDate(new Date(to), 'end')

	const contains = `%${filterOptions.query.replace(/ /g, '%')}%`

	const createSearchCondition = (fieldName: string) => ({
		[fieldName]: {
			name: { contains, mode: 'insensitive' },
			manager: { name: { contains, mode: 'insensitive' } },
		},
	})

	return {
		...(entityType === 'TRIBE' && tribeId && { tribeId }),
		...(entityType === 'DEPARTMENT' && departmentId && { departmentId }),
		...(entityType === 'HONOR_FAMILY' && honorFamilyId && { honorFamilyId }),
		OR: [
			createSearchCondition('tribe'),
			createSearchCondition('honorFamily'),
			createSearchCondition('department'),
		],
		...(tribeId && { tribeId }),
		...(departmentId && { departmentId }),
		...(honorFamilyId && { honorFamilyId }),
		createdAt: { gte: startDate, lte: endDate },
	}
}

function formatOptions(options: MemberFilterOptions) {
	const filterOptions: any = {}

	for (const [key, value] of Object.entries(options)) {
		filterOptions[key] = value.toLocaleString() === 'ALL' ? undefined : value
	}

	return filterOptions
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
