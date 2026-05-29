import { parseWithZod } from '@conform-to/zod'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireRole } from '~/utils/auth.server'
import { schema } from './schema'
import { prisma } from '~/infrastructures/database/prisma.server'
import { type Prisma, Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { AttendanceState } from '~/shared/enum'
import {
	getMonthlyAttendanceState,
	type MonthlyAttendance,
} from '~/shared/attendance'
import { eachDayOfInterval, isSunday, parseISO } from 'date-fns'
import {
	formatAttendanceData,
	type AttendanceStats,
} from '~/helpers/attendance.server'

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN]

const ACTIVE_MEMBER_FILTER: Prisma.UserWhereInput = {
	isActive: true,
	NOT: { roles: { hasSome: ADMIN_ROLES } },
}

export async function loader({ request }: LoaderFunctionArgs) {
	const currentUser = await requireRole(request, ['ADMIN'])
	const url = new URL(request.url)

	const submission = parseWithZod(url.searchParams, { schema })

	invariant(currentUser.churchId, 'ChurchId must be defined')

	if (submission.status != 'success') return submission.reply()

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

function buildDateFilter(dateFrom: Date, dateTo: Date) {
	return { date: { gte: dateFrom, lte: dateTo } }
}

function buildWhereCondition(
	entityType: string,
	churchId: string,
	dateFrom: Date,
	dateTo: Date,
): Prisma.AttendanceWhereInput {
	const dateFilter = buildDateFilter(dateFrom, dateTo)
	const baseMember = { churchId, ...ACTIVE_MEMBER_FILTER }

	switch (entityType) {
		case 'CULTE':
			return { ...dateFilter, member: baseMember }

		case 'DEPARTMENT':
			return {
				...dateFilter,
				inService: { not: null },
				member: { ...baseMember, departmentId: { not: null } },
			}

		case 'TRIBE':
			return {
				...dateFilter,
				inService: { not: null },
				member: { ...baseMember, tribeId: { not: null } },
			}

		case 'HONOR_FAMILY':
			return {
				...dateFilter,
				inMeeting: { not: null },
				member: { ...baseMember, honorFamilyId: { not: null } },
			}

		default:
			return {}
	}
}

const ATTENDANCE_TYPE: Record<string, 'church' | 'service' | 'meeting'> = {
	CULTE: 'church',
	DEPARTMENT: 'service',
	TRIBE: 'service',
	HONOR_FAMILY: 'meeting',
}

async function getAttendanceData(
	entityType: string,
	churchId: string,
	dateFrom: Date,
	dateTo: Date,
) {
	const sundays = eachDayOfInterval({ start: dateFrom, end: dateTo }).filter(
		day => isSunday(day),
	).length

	const whereCondition = buildWhereCondition(entityType, churchId, dateFrom, dateTo)

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

		if (attendance.inChurch) memberData.churchAttendance++
		if (attendance.inService) memberData.serviceAttendance++
		if (attendance.inMeeting) memberData.meetingAttendance++
	})

	const stats: AttendanceStats = {
		veryRegular: 0,
		regular: 0,
		littleRegular: 0,
		absent: 0,
	}

	let newMembers = 0
	let oldMembers = 0

	const attendanceType = ATTENDANCE_TYPE[entityType] ?? 'church'

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

		const joinedDuringPeriod =
			memberData.createdAt >= dateFrom && memberData.createdAt <= dateTo

		joinedDuringPeriod ? newMembers++ : oldMembers++
	})

	const totalMembers =
		stats.veryRegular + stats.regular + stats.littleRegular + stats.absent

	return { totalMembers, stats, memberStats: { newMembers, oldMembers } }
}
