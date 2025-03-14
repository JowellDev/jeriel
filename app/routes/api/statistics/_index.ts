import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { statsSchema } from './schema'
import { AttendanceReportEntity, type Prisma } from '@prisma/client'
import { type z } from 'zod'
import { isSameMonth, startOfDay } from 'date-fns'
import { prepareDateRanges } from '~/utils/attendance.server'
import { parseWithZod } from '@conform-to/zod'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	const url = new URL(request.url)

	const submission = parseWithZod(url.searchParams, { schema: statsSchema })

	if (submission.status != 'success') return

	const { from, to, tribeId, departmentId, honorFamilyId } = submission.value
	const { currentMonthSundays } = prepareDateRanges(new Date(to))

	const where = {
		churchId: currentUser.churchId,
		id: { not: currentUser.id },
		...(tribeId && { tribeId }),
		...(departmentId && { departmentId }),
		...(honorFamilyId && { honorFamilyId }),
	} satisfies Prisma.UserWhereInput

	const members = await prisma.user.findMany({
		where,
		select: {
			id: true,
			name: true,
			createdAt: true,
		},
	})

	const memberIds = members.map(m => m.id)

	const attendanceReports = await fetchAttendanceReports(
		submission.value,
		memberIds,
		new Date(from),
		new Date(to),
	)

	const extractedAttendances: AttendanceWithType[] =
		attendanceReports?.flatMap(report => {
			return (
				report?.attendances?.map(attendance => {
					return 'inChurch' in attendance
						? ({
								...attendance,
								type: 'church',
								inMeeting: null,
							} as AttendanceWithType)
						: ({
								...attendance,
								type: 'meeting',
								inChurch: null,
							} as AttendanceWithType)
				}) || []
			)
		}) || []

	const membersStats = getMembersAttendances(
		members,
		extractedAttendances,
		currentMonthSundays,
	)

	const oldMembersStats = membersStats.filter(
		member => !isSameMonth(new Date(member.createdAt), new Date()),
	)
	const newMembersStats = membersStats.filter(member =>
		isSameMonth(new Date(member.createdAt), new Date()),
	)

	return json({
		oldMembersStats,
		newMembersStats,
	})
}

function fetchAttendanceReports(
	value: z.infer<typeof statsSchema>,
	memberIds: string[],
	fromDate: Date,
	toDate: Date,
) {
	const { tribeId, honorFamilyId, departmentId } = value

	const dateFilter = {
		attendances: {
			every: { date: { gte: fromDate, lte: toDate } },
		},
	}

	const memberFilterForChurch = {
		attendances: {
			where: { memberId: { in: memberIds } },
			select: {
				memberId: true,
				date: true,
				inChurch: true,
			},
		},
	}

	const memberFilterForMeeting = {
		attendances: {
			where: { memberId: { in: memberIds } },
			select: {
				memberId: true,
				date: true,
				inMeeting: true,
			},
		},
	}

	if (tribeId) {
		return prisma.attendanceReport.findMany({
			where: {
				entity: AttendanceReportEntity.TRIBE,
				tribeId: value.tribeId,
				...dateFilter,
			},
			include: memberFilterForChurch,
		})
	}

	if (departmentId) {
		return prisma.attendanceReport.findMany({
			where: {
				entity: AttendanceReportEntity.DEPARTMENT,
				departmentId: value.departmentId,
				...dateFilter,
			},
			include: memberFilterForChurch,
		})
	}

	if (honorFamilyId) {
		return prisma.attendanceReport.findMany({
			where: {
				entity: AttendanceReportEntity.HONOR_FAMILY,
				honorFamilyId: value.honorFamilyId,
				...dateFilter,
			},
			include: memberFilterForMeeting,
		})
	}

	return []
}

type AttendanceWithType = {
	memberId: string
	date: Date
	inChurch: boolean | null
	inMeeting: boolean | null
	type: 'church' | 'meeting' | 'unknown'
}

interface Member {
	id: string
	name: string
	createdAt: Date | string
}

function getMembersAttendances(
	members: Member[],
	attendances: AttendanceWithType[],
	currentMonthSundays: Date[],
) {
	return members.map(member => {
		const memberAttendances = attendances.filter(
			attendance => attendance.memberId === member.id,
		)

		return {
			...member,
			monthAttendanceResume: memberAttendances.filter(attendance => {
				return attendance.type === 'church'
					? attendance.inChurch
					: attendance.inMeeting
			}).length,
			sundays: memberAttendances.filter(attendance => attendance.date).length,
			monthStatistcs: currentMonthSundays.map(sunday => ({
				sunday,
				churchPresence: (() => {
					const matchedAttendance = memberAttendances.find(
						attendance =>
							startOfDay(attendance.date).getTime() ===
							startOfDay(sunday).getTime(),
					)

					if (!matchedAttendance) return null

					return matchedAttendance.type === 'church'
						? matchedAttendance.inChurch
						: null
				})(),
				meetingPresence: (() => {
					const matchedAttendance = memberAttendances.find(
						attendance =>
							startOfDay(attendance.date).getTime() ===
							startOfDay(sunday).getTime(),
					)

					if (!matchedAttendance) return null

					return matchedAttendance.type === 'meeting'
						? matchedAttendance.inMeeting
						: null
				})(),
			})),
		}
	})
}
