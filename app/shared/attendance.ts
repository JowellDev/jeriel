import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { attendanceStateEmoji, frenchAttendanceState } from './constants'
import { AttendanceState } from './enum'
import { format, sub } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getMonthSundays } from '~/utils/date'

export interface MonthlyAttendance {
	attendance: number
	serviceAttendance: number
	sundays: number
}

export function getMonthlyAttendanceState(
	data: MonthlyAttendance,
	type: 'church' | 'service' = 'church',
) {
	const { attendance, serviceAttendance, sundays } = data
	const percentage =
		type === 'church'
			? (attendance / sundays) * 100
			: (serviceAttendance / sundays) * 100

	switch (true) {
		case percentage === 100:
			return AttendanceState.VERY_REGULAR
		case percentage >= 60 && percentage < 100:
			return AttendanceState.REGULAR
		case percentage >= 50 && percentage < 60:
			return AttendanceState.MEDIUM_REGULAR
		case percentage < 50 && percentage > 0:
			return AttendanceState.LITTLE_REGULAR
		default:
			return AttendanceState.ABSENT
	}
}

export function getMembersAttendances(
	members: Member[],
): MemberMonthlyAttendances[] {
	const currentMonthSundays = getMonthSundays(new Date())
	return members.map(member => ({
		...member,
		previousMonthAttendanceResume: null,
		currentMonthAttendanceResume: null,
		currentMonthAttendances: currentMonthSundays.map(sunday => ({
			sunday,
			isPresent: null,
			servicePresence: null,
		})),
	}))
}

export function transformMembersDataForExport(
	members: MemberMonthlyAttendances[],
): Record<string, string>[] {
	const currentMonth = new Date()
	const lastMonth = sub(currentMonth, { months: 1 })

	return members.map(member => {
		const row: Record<string, string> = {
			'Nom & prénoms': member.name,
			Téléphone: member.phone,
		}

		const lastMonthKey = `Etat ${format(lastMonth, 'MMM yyyy', { locale: fr })}`
		row[lastMonthKey] = getAttendanceFrequence(
			member.previousMonthAttendanceResume,
		)

		member.currentMonthAttendances.forEach((attendance, index) => {
			row[`D${index + 1}`] = formatAttendance(attendance.isPresent)
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
