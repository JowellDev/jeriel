import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import {
	attendanceStateEmoji,
	frenchAttendanceState,
	ATTENDANCE_THRESHOLDS,
} from './constants'
import { AttendanceState } from './enum'
import { format, startOfDay, sub } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Attendance } from './types'
import { getMonthWeeks } from '~/utils/date'

export interface MonthlyAttendance {
	churchAttendance: number
	serviceAttendance: number
	meetingAttendance: number
	sundays: number
	meetings?: number
}

function getAttendanceState(percentage: number): AttendanceState {
	if (percentage >= ATTENDANCE_THRESHOLDS.VERY_REGULAR)
		return AttendanceState.VERY_REGULAR
	if (percentage >= ATTENDANCE_THRESHOLDS.REGULAR_MIN)
		return AttendanceState.REGULAR
	if (percentage >= ATTENDANCE_THRESHOLDS.MEDIUM_REGULAR_MIN)
		return AttendanceState.MEDIUM_REGULAR
	if (percentage >= ATTENDANCE_THRESHOLDS.LITTLE_REGULAR_MIN)
		return AttendanceState.LITTLE_REGULAR
	return AttendanceState.ABSENT
}

export function getMonthlyAttendanceState(
	data: MonthlyAttendance,
	type: 'church' | 'service' | 'meeting' = 'church',
) {
	if (!data.sundays) return AttendanceState.ABSENT
	const isChurch = type === 'church'
	const isService = type === 'service'

	const count = isChurch
		? data.churchAttendance
		: isService
			? data.serviceAttendance
			: data.meetingAttendance

	return getAttendanceState((count / data.sundays) * 100)
}

export function getMembersAttendances(
	members: Member[],
	currentMonthSundays: Date[],
	previousMonthSundays: Date[],
	attendances?: Attendance[],
	previousAttendances?: Attendance[],
): MemberMonthlyAttendances[] {
	if (!attendances || !previousAttendances) return []

	const currentMonthWeeks = getMonthWeeks(currentMonthSundays[0])
	const previousMonthWeeks = getMonthWeeks(previousMonthSundays[0])

	const currentSundayTimes = new Set(
		currentMonthSundays.map(d => startOfDay(d).getTime()),
	)

	const previousSundayTimes = new Set(
		previousMonthSundays.map(d => startOfDay(d).getTime()),
	)

	const currentSundayEntries = currentMonthSundays.map(sunday => ({
		sunday,
		time: startOfDay(sunday).getTime(),
	}))

	const attendancesByMember = groupAttendancesByMemberId(attendances)
	const previousAttendancesByMember =
		groupAttendancesByMemberId(previousAttendances)

	return members.map(member => {
		const memberAttendances = attendancesByMember.get(member.id) ?? []
		const previousMemberAttendances =
			previousAttendancesByMember.get(member.id) ?? []

		const previousMonthAttendances = previousMemberAttendances.filter(a =>
			previousSundayTimes.has(startOfDay(a.date).getTime()),
		)

		const previousMonthMeetingAttendances = filterMeetingAttendances(
			previousMemberAttendances,
			previousMonthWeeks,
		)

		const currentMonthSundayAttendances = memberAttendances.filter(a =>
			currentSundayTimes.has(startOfDay(a.date).getTime()),
		)

		const currentMonthMeetingAttendances = filterMeetingAttendances(
			memberAttendances,
			currentMonthWeeks,
		)

		const currentSundayAttendanceMap =
			createAttendanceMapByDate(memberAttendances)

		const currentWeekAttendanceMap = createAttendanceMapByWeek(
			memberAttendances,
			currentMonthWeeks,
		)

		return {
			...member,
			previousMonthAttendanceResume: calculateMonthlyResume(
				previousMonthAttendances,
			),
			previousMonthMeetingResume: calculateMonthlyResume(
				previousMonthMeetingAttendances,
			),
			currentMonthAttendanceResume: calculateMonthlyResume(
				currentMonthSundayAttendances,
			),
			currentMonthMeetingResume: calculateMonthlyResume(
				currentMonthMeetingAttendances,
			),
			currentMonthAttendances: currentSundayEntries.map(({ sunday, time }) => {
				const attendance = currentSundayAttendanceMap.get(time)
				return {
					sunday,
					churchPresence: attendance?.inChurch ?? null,
					hasConflict: attendance?.hasConflict ?? false,
					servicePresence: attendance?.inService ?? null,
					meetingPresence: null,
				}
			}),
			currentMonthMeetings: currentMonthWeeks.map(week => {
				const attendance = currentWeekAttendanceMap.get(
					week.startDate.getTime(),
				)
				return {
					date: week.startDate,
					meetingPresence: attendance?.inMeeting ?? null,
					hasConflict: attendance?.hasConflict ?? false,
				}
			}),
		}
	})
}

function groupAttendancesByMemberId(
	attendances: Attendance[],
): Map<string, Attendance[]> {
	const map = new Map<string, Attendance[]>()

	for (const a of attendances) {
		const list = map.get(a.memberId) ?? []
		list.push(a)
		map.set(a.memberId, list)
	}

	return map
}

function filterMeetingAttendances(
	attendances: Attendance[],
	weeks: Array<{ startDate: Date; endDate: Date }>,
): Attendance[] {
	return attendances.filter(a =>
		weeks.some(
			week =>
				a.date >= week.startDate &&
				a.date <= week.endDate &&
				a.inMeeting !== null,
		),
	)
}

function createAttendanceMapByDate(
	attendances: Attendance[],
): Map<number, Attendance> {
	const map = new Map<number, Attendance>()

	for (const attendance of attendances) {
		map.set(startOfDay(attendance.date).getTime(), attendance)
	}

	return map
}

function createAttendanceMapByWeek(
	attendances: Attendance[],
	weeks: Array<{ startDate: Date; endDate: Date }>,
): Map<number, Attendance> {
	const meetingAttendances = attendances.filter(a => a.inMeeting !== null)
	const map = new Map<number, Attendance>()

	for (const week of weeks) {
		const attendance = meetingAttendances.find(
			a => a.date >= week.startDate && a.date <= week.endDate,
		)

		if (attendance) {
			map.set(week.startDate.getTime(), attendance)
		}
	}
	return map
}

function calculateMonthlyResume(
	attendances: Array<{
		inChurch: boolean
		inService: boolean | null
		inMeeting: boolean | null
	}>,
): MonthlyAttendance | null {
	if (!attendances.length) return null

	let churchAttendance = 0
	let serviceAttendance = 0
	let meetingAttendance = 0

	for (const a of attendances) {
		if (a.inChurch) churchAttendance++
		if (a.inService) serviceAttendance++
		if (a.inMeeting) meetingAttendance++
	}

	return {
		churchAttendance,
		serviceAttendance,
		meetingAttendance,
		sundays: attendances.length,
	}
}

export function getStatsAttendanceState(
	presenceNumber: number,
	sundaysNumber: number,
) {
	if (!sundaysNumber) return AttendanceState.ABSENT
	return getAttendanceState((presenceNumber / sundaysNumber) * 100)
}

export function transformMembersDataForExport(
	members: MemberMonthlyAttendances[],
): Record<string, string>[] {
	const lastMonth = sub(new Date(), { months: 1 })

	return members.map(member => {
		const row: Record<string, string> = {
			'Nom & prénoms': member.name,
			Téléphone: member.phone ?? 'N/D',
			Email: member.email ?? 'N/D',
		}

		const lastMonthKey = `Etat ${format(lastMonth, 'MMM yyyy', { locale: fr })}`
		const currentMonthKey = `Etat ${format(new Date(), 'MMM yyyy', { locale: fr })}`

		row[lastMonthKey] = getAttendanceFrequence({
			attendance: member.previousMonthAttendanceResume,
		})

		member.currentMonthAttendances.forEach((attendance, index) => {
			row[`D${index + 1}`] = formatAttendance(attendance.churchPresence)
		})

		row[currentMonthKey] = getAttendanceFrequence({
			attendance: member.currentMonthAttendanceResume,
		})

		return row
	})
}

export function getAttendanceFrequence({
	attendance,
	withEmoji = true,
}: {
	attendance: MonthlyAttendance | null
	withEmoji?: boolean
}): string {
	if (!attendance) return '-'

	const state = getMonthlyAttendanceState(attendance)
	const frequence = frenchAttendanceState[state]

	if (!withEmoji) return frequence

	const emoji = attendanceStateEmoji[state]
	return `${emoji} ${frequence}`
}

export function formatAttendance(isPresent: boolean | null): string {
	if (isPresent === true) return 'Présent'
	if (isPresent === false) return 'Absent'

	return '-'
}
