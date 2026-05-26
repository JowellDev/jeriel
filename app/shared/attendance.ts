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
	if (percentage >= ATTENDANCE_THRESHOLDS.VERY_REGULAR) return AttendanceState.VERY_REGULAR
	if (percentage >= ATTENDANCE_THRESHOLDS.REGULAR_MIN) return AttendanceState.REGULAR
	if (percentage >= ATTENDANCE_THRESHOLDS.MEDIUM_REGULAR_MIN) return AttendanceState.MEDIUM_REGULAR
	if (percentage >= ATTENDANCE_THRESHOLDS.LITTLE_REGULAR_MIN) return AttendanceState.LITTLE_REGULAR
	return AttendanceState.ABSENT
}

export function getMonthlyAttendanceState(
	data: MonthlyAttendance,
	type: 'church' | 'service' | 'meeting' = 'church',
) {
	if (!data.sundays) return AttendanceState.ABSENT
	const count =
		type === 'church' ? data.churchAttendance
		: type === 'service' ? data.serviceAttendance
		: data.meetingAttendance

	return getAttendanceState((count / data.sundays) * 100)
}

interface AttendanceContext {
	currentSundayTimes: Set<number>
	previousSundayTimes: Set<number>
	currentSundayEntries: { sunday: Date; time: number }[]
	currentMonthWeeks: Array<{ startDate: Date; endDate: Date }>
	previousMonthWeeks: Array<{ startDate: Date; endDate: Date }>
	attendancesByMember: Map<string, Attendance[]>
	previousAttendancesByMember: Map<string, Attendance[]>
}

function buildAttendanceContext(
	currentMonthSundays: Date[],
	previousMonthSundays: Date[],
	attendances: Attendance[],
	previousAttendances: Attendance[],
): AttendanceContext {
	return {
		currentMonthWeeks: getMonthWeeks(currentMonthSundays[0]),
		previousMonthWeeks: getMonthWeeks(previousMonthSundays[0]),
		currentSundayTimes: new Set(currentMonthSundays.map(d => startOfDay(d).getTime())),
		previousSundayTimes: new Set(previousMonthSundays.map(d => startOfDay(d).getTime())),
		currentSundayEntries: currentMonthSundays.map(s => ({ sunday: s, time: startOfDay(s).getTime() })),
		attendancesByMember: groupAttendancesByMemberId(attendances),
		previousAttendancesByMember: groupAttendancesByMemberId(previousAttendances),
	}
}

function buildCurrentMonthAttendances(
	sundayEntries: { sunday: Date; time: number }[],
	sundayMap: Map<number, Attendance>,
) {
	return sundayEntries.map(({ sunday, time }) => {
		const a = sundayMap.get(time)
		return {
			sunday,
			churchPresence: a?.inChurch ?? null,
			hasConflict: a?.hasConflict ?? false,
			servicePresence: a?.inService ?? null,
			meetingPresence: null,
		}
	})
}

function buildCurrentMonthMeetings(
	weeks: Array<{ startDate: Date; endDate: Date }>,
	weekMap: Map<number, Attendance>,
) {
	return weeks.map(week => {
		const a = weekMap.get(week.startDate.getTime())
		return {
			date: week.startDate,
			meetingPresence: a?.inMeeting ?? null,
			hasConflict: a?.hasConflict ?? false,
		}
	})
}

function buildMemberMonthlyData(member: Member, ctx: AttendanceContext): MemberMonthlyAttendances {
	const memberAttendances = ctx.attendancesByMember.get(member.id) ?? []
	const prevAttendances = ctx.previousAttendancesByMember.get(member.id) ?? []

	const prevSundayAttendances = prevAttendances.filter(a => ctx.previousSundayTimes.has(startOfDay(a.date).getTime()))
	const prevMeetingAttendances = filterMeetingAttendances(prevAttendances, ctx.previousMonthWeeks)
	const currentSundayAttendances = memberAttendances.filter(a => ctx.currentSundayTimes.has(startOfDay(a.date).getTime()))
	const currentMeetingAttendances = filterMeetingAttendances(memberAttendances, ctx.currentMonthWeeks)

	return {
		...member,
		previousMonthAttendanceResume: calculateMonthlyResume(prevSundayAttendances),
		previousMonthMeetingResume: calculateMonthlyResume(prevMeetingAttendances),
		currentMonthAttendanceResume: calculateMonthlyResume(currentSundayAttendances),
		currentMonthMeetingResume: calculateMonthlyResume(currentMeetingAttendances),
		currentMonthAttendances: buildCurrentMonthAttendances(ctx.currentSundayEntries, createAttendanceMapByDate(memberAttendances)),
		currentMonthMeetings: buildCurrentMonthMeetings(ctx.currentMonthWeeks, createAttendanceMapByWeek(memberAttendances, ctx.currentMonthWeeks)),
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
	const ctx = buildAttendanceContext(currentMonthSundays, previousMonthSundays, attendances, previousAttendances)
	return members.map(member => buildMemberMonthlyData(member, ctx))
}

function groupAttendancesByMemberId(attendances: Attendance[]): Map<string, Attendance[]> {
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
		weeks.some(week => a.date >= week.startDate && a.date <= week.endDate && a.inMeeting !== null),
	)
}

function createAttendanceMapByDate(attendances: Attendance[]): Map<number, Attendance> {
	const map = new Map<number, Attendance>()
	for (const a of attendances) {
		map.set(startOfDay(a.date).getTime(), a)
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
		const a = meetingAttendances.find(a => a.date >= week.startDate && a.date <= week.endDate)
		if (a) map.set(week.startDate.getTime(), a)
	}
	return map
}

function calculateMonthlyResume(
	attendances: Array<{ inChurch: boolean; inService: boolean | null; inMeeting: boolean | null }>,
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

	return { churchAttendance, serviceAttendance, meetingAttendance, sundays: attendances.length }
}

export function getStatsAttendanceState(presenceNumber: number, sundaysNumber: number) {
	if (!sundaysNumber) return AttendanceState.ABSENT
	return getAttendanceState((presenceNumber / sundaysNumber) * 100)
}

function buildMemberExportRow(
	member: MemberMonthlyAttendances,
	lastMonthKey: string,
	currentMonthKey: string,
): Record<string, string> {
	const row: Record<string, string> = {
		'Nom & prénoms': member.name,
		Téléphone: member.phone ?? 'N/D',
		Email: member.email ?? 'N/D',
	}
	row[lastMonthKey] = getAttendanceFrequence({ attendance: member.previousMonthAttendanceResume })
	member.currentMonthAttendances.forEach((att, i) => { row[`D${i + 1}`] = formatAttendance(att.churchPresence) })
	row[currentMonthKey] = getAttendanceFrequence({ attendance: member.currentMonthAttendanceResume })
	return row
}

export function transformMembersDataForExport(members: MemberMonthlyAttendances[]): Record<string, string>[] {
	const lastMonth = sub(new Date(), { months: 1 })
	const lastMonthKey = `Etat ${format(lastMonth, 'MMM yyyy', { locale: fr })}`
	const currentMonthKey = `Etat ${format(new Date(), 'MMM yyyy', { locale: fr })}`
	return members.map(member => buildMemberExportRow(member, lastMonthKey, currentMonthKey))
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
	return `${attendanceStateEmoji[state]} ${frequence}`
}

export function formatAttendance(isPresent: boolean | null): string {
	if (isPresent === true) return 'Présent'
	if (isPresent === false) return 'Absent'
	return '-'
}
