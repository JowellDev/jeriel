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

	const { from, to, tribeId } = submission.value
	const { currentMonthSundays } = prepareDateRanges(new Date(to))

	const where = {
		churchId: currentUser.churchId,
		id: { not: currentUser.id },
		tribeId,
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

	const extractedAttendances = attendanceReports.flatMap(
		report => report.attendances,
	)

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
			},
		},
	}

	return prisma.attendanceReport.findMany({
		where: {
			...(value.tribeId && {
				entity: AttendanceReportEntity.TRIBE,
				tribeId: value.tribeId,
			}),

			...dateFilter,
		},
		include: memberFilter,
	})
}

function getMembersAttendances(
	members: Member[],
	attendances: Attendance[],
	currentMonthSundays: Date[],
) {
	return members.map(member => {
		const memberAttendances = attendances.filter(
			attendance => attendance.memberId === member.id,
		)

		return {
			...member,
			monthAttendanceResume: memberAttendances.filter(
				attendance => attendance.inChurch,
			).length,
			sundays: memberAttendances.filter(attendance => attendance.date).length,
			monthStatistcs: currentMonthSundays.map(sunday => ({
				sunday,
				churchPresence:
					memberAttendances.find(
						attendance =>
							startOfDay(attendance.date).getTime() ===
							startOfDay(sunday).getTime(),
					)?.inChurch ?? null,
			})),
		}
	})
}

type Attendance = {
	memberId: string
	date: Date
	inChurch: boolean
}
interface Member {
	id: string
	name: string
	createdAt: Date | string
}
