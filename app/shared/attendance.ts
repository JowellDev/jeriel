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

export function getMonthlyAttendanceState(
	data: MonthlyAttendance,
	type: 'church' | 'service' | 'meeting' = 'church',
) {
	const { churchAttendance, serviceAttendance, meetingAttendance, sundays } =
		data
	const percentage =
		type === 'church'
			? (churchAttendance / sundays) * 100
			: type === 'service'
				? (serviceAttendance / sundays) * 100
				: (meetingAttendance / sundays) * 100

	switch (true) {
		case percentage === ATTENDANCE_THRESHOLDS.VERY_REGULAR:
			return AttendanceState.VERY_REGULAR
		case percentage >= ATTENDANCE_THRESHOLDS.REGULAR_MIN &&
			percentage <= ATTENDANCE_THRESHOLDS.REGULAR_MAX:
			return AttendanceState.REGULAR
		case percentage >= ATTENDANCE_THRESHOLDS.MEDIUM_REGULAR_MIN &&
			percentage <= ATTENDANCE_THRESHOLDS.MEDIUM_REGULAR_MAX:
			return AttendanceState.MEDIUM_REGULAR
		case percentage >= ATTENDANCE_THRESHOLDS.LITTLE_REGULAR_MIN &&
			percentage <= ATTENDANCE_THRESHOLDS.LITTLE_REGULAR_MAX:
			return AttendanceState.LITTLE_REGULAR
		default:
			return AttendanceState.ABSENT
	}
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

	return members.map(member => {
		const memberAttendances = attendances.filter(a => a.memberId === member.id)
		const previousMemberAttendances = previousAttendances.filter(
			a => a.memberId === member.id,
		)

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
			currentMonthAttendances: currentMonthSundays.map(sunday => {
				const sundayTime = startOfDay(sunday).getTime()
				const attendance = currentSundayAttendanceMap.get(sundayTime)

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
		const dateTime = startOfDay(attendance.date).getTime()
		map.set(dateTime, attendance)
	}

	return map
}

function createAttendanceMapByWeek(
	attendances: Attendance[],
	weeks: Array<{ startDate: Date; endDate: Date }>,
): Map<number, Attendance> {
	const map = new Map<number, Attendance>()
	for (const week of weeks) {
		const attendance = attendances.find(
			a =>
				a.date >= week.startDate &&
				a.date <= week.endDate &&
				a.inMeeting !== null,
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

	const sundays = attendances.length
	const churchAttendance = attendances.filter(a => a.inChurch).length
	const serviceAttendance = attendances.filter(a => a.inService).length
	const meetingAttendance = attendances.filter(a => a.inMeeting).length

	return {
		churchAttendance,
		serviceAttendance,
		meetingAttendance,
		sundays,
	}
}

export function getStatsAttendanceState(
	presenceNumber: number,
	sundaysNumber: number,
) {
	const percentage = (presenceNumber / sundaysNumber) * 100

	switch (true) {
		case percentage === ATTENDANCE_THRESHOLDS.VERY_REGULAR:
			return AttendanceState.VERY_REGULAR
		case percentage >= ATTENDANCE_THRESHOLDS.REGULAR_MIN &&
			percentage <= ATTENDANCE_THRESHOLDS.REGULAR_MAX:
			return AttendanceState.REGULAR
		case percentage >= ATTENDANCE_THRESHOLDS.MEDIUM_REGULAR_MIN &&
			percentage <= ATTENDANCE_THRESHOLDS.MEDIUM_REGULAR_MAX:
			return AttendanceState.MEDIUM_REGULAR
		case percentage >= ATTENDANCE_THRESHOLDS.LITTLE_REGULAR_MIN &&
			percentage <= ATTENDANCE_THRESHOLDS.LITTLE_REGULAR_MAX:
			return AttendanceState.LITTLE_REGULAR
		default:
			return AttendanceState.ABSENT
	}
}

export function transformMembersDataForExport(
	members: MemberMonthlyAttendances[],
): Record<string, string>[] {
	const currentMonth = new Date()
	const lastMonth = sub(currentMonth, { months: 1 })

	return members.map(member => {
		const row: Record<string, string> = {
			'Nom & prénoms': member.name,
			Téléphone: member.phone ?? 'N/D',
			Email: member.email ?? 'N/D',
		}

		const lastMonthKey = `Etat ${format(lastMonth, 'MMM yyyy', { locale: fr })}`
		row[lastMonthKey] = getAttendanceFrequence(
			member.previousMonthAttendanceResume,
		)

		member.currentMonthAttendances.forEach((attendance, index) => {
			row[`D${index + 1}`] = formatAttendance(attendance.churchPresence)
		})

		row['Etat du mois'] = getAttendanceFrequence(
			member.currentMonthAttendanceResume,
		)

		return row
	})
}

function getAttendanceFrequence(attendance: MonthlyAttendance | null) {
	if (!attendance) return '-'

	const state = getMonthlyAttendanceState(attendance)
	const emoji = attendanceStateEmoji[state]
	const frequence = frenchAttendanceState[state]
	return `${emoji} ${frequence}`
}

function formatAttendance(isPresent: boolean | null): string {
	if (isPresent === true) return 'Présent'
	if (isPresent === false) return 'Absent'
	return '-'
}
