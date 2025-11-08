import { parseWithZod } from '@conform-to/zod'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireRole } from '~/utils/auth.server'
import { schema } from './schema'
import { prisma } from '~/utils/db.server'
import { type Prisma } from '@prisma/client'
import invariant from 'tiny-invariant'
import { AttendanceState } from '~/shared/enum'
import {
	getMonthlyAttendanceState,
	type MonthlyAttendance,
} from '~/shared/attendance'
import { eachDayOfInterval, isSameMonth, isSunday, parseISO } from 'date-fns'
import { formatAttendanceData } from '~/utils/compare.server'

interface AttendanceStats {
	veryRegular: number
	regular: number
	littleRegular: number
	absent: number
}

export async function loader({ request }: LoaderFunctionArgs) {
	const currentUser = await requireRole(request, ['ADMIN'])
	const url = new URL(request.url)

	const submission = parseWithZod(url.searchParams, { schema })

	invariant(currentUser.churchId, 'ChurchId must be defined')

	if (submission.status != 'success') return

	const { entity, firstDateFrom, firstDateTo, secondDateFrom, secondDateTo } =
		submission.value

	const [firstPeriodData, secondPeriodData] = await Promise.all([
		getAttendanceData(
			entity,
			currentUser.churchId,
			parseISO(firstDateFrom),
			parseISO(firstDateTo),
		),
		getAttendanceData(
			entity,
			currentUser.churchId,
			parseISO(secondDateFrom),
			parseISO(secondDateTo),
		),
	])

	const formattedFirstPeriod = formatAttendanceData(
		firstPeriodData,
		parseISO(firstDateFrom),
	)

	const formattedSecondPeriod = formatAttendanceData(
		secondPeriodData,
		parseISO(secondDateFrom),
	)

	return {
		firstPeriodData: formattedFirstPeriod,
		secondPeriodData: formattedSecondPeriod,
		filterData: submission.value,
	}
}

export type AttendanceLoader = typeof loader

async function getAttendanceData(
	entityType: string,
	churchId: string,
	dateFrom: Date,
	dateTo: Date,
) {
	const sundays = eachDayOfInterval({ start: dateFrom, end: dateTo }).filter(
		day => isSunday(day),
	).length

	let whereCondition: Prisma.AttendanceWhereInput = {}

	switch (entityType) {
		case 'CULTE':
			whereCondition = {
				date: {
					gte: dateFrom,
					lte: dateTo,
				},
				member: {
					churchId,
				},
			}
			break

		case 'DEPARTMENT':
			whereCondition = {
				date: {
					gte: dateFrom,
					lte: dateTo,
				},
				inService: { not: null },
				member: {
					departmentId: { not: null },
					churchId,
				},
			}

			break

		case 'TRIBE':
			whereCondition = {
				date: {
					gte: dateFrom,
					lte: dateTo,
				},
				inService: { not: null },
				member: {
					tribeId: { not: null },
					churchId,
				},
			}

			break

		case 'HONOR_FAMILY':
			whereCondition = {
				date: {
					gte: dateFrom,
					lte: dateTo,
				},
				inMeeting: { not: null },
				member: {
					honorFamilyId: { not: null },
					churchId,
				},
			}

			break
	}

	const attendances = await prisma.attendance.findMany({
		where: whereCondition,
		include: {
			member: { select: { createdAt: true } },
		},
	})

	const memberAttendances = new Map<
		string,
		MonthlyAttendance & { createdAt: Date }
	>()

	attendances.forEach(attendance => {
		const memberId = attendance.memberId

		if (!memberAttendances.has(memberId)) {
			memberAttendances.set(memberId, {
				churchAttendance: 0,
				serviceAttendance: 0,
				meetingAttendance: 0,
				sundays,
				createdAt: attendance.member.createdAt,
			})
		}

		const memberData = memberAttendances.get(memberId)!

		if (attendance.inChurch) {
			memberData.churchAttendance++
		}
		if (attendance.inService) {
			memberData.serviceAttendance++
		}
		if (attendance.inMeeting) {
			memberData.meetingAttendance++
		}
	})

	const stats: AttendanceStats = {
		veryRegular: 0,
		regular: 0,
		littleRegular: 0,
		absent: 0,
	}

	let newMembers = 0
	let oldMembers = 0

	const attendanceType =
		entityType === 'CULTE'
			? 'church'
			: entityType === 'DEPARTMENT'
				? 'service'
				: entityType === 'TRIBE'
					? 'service'
					: 'meeting'

	memberAttendances.forEach(memberData => {
		const state = getMonthlyAttendanceState(memberData, attendanceType)
		switch (state) {
			case AttendanceState.VERY_REGULAR:
				stats.veryRegular++
				break
			case AttendanceState.REGULAR:
				stats.regular++
				break
			case AttendanceState.MEDIUM_REGULAR:
			case AttendanceState.LITTLE_REGULAR:
				stats.littleRegular++
				break
			case AttendanceState.ABSENT:
				stats.absent++
				break
		}
		const isNewMember = isSameMonth(new Date(memberData.createdAt), dateFrom)

		isNewMember ? newMembers++ : oldMembers++
	})

	const totalMembers =
		stats.veryRegular + stats.regular + stats.littleRegular + stats.absent

	return {
		totalMembers,
		stats,
		memberStats: {
			newMembers,
			oldMembers,
		},
	}
}
