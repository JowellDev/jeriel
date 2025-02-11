import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { attendanceStateEmoji, frenchAttendanceState } from './constants'
import { AttendanceState } from './enum'
import { format, startOfDay, sub } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Attendance } from './types'

export interface MonthlyAttendance {
	churchAttendance: number
	serviceAttendance: number
	meetingAttendance: number
	sundays: number
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
	attendances: Attendance[],
	previousAttendances: Attendance[],
	currentMonthSundays: Date[],
	previousMonthSundays: Date[],
): MemberMonthlyAttendances[] {
	return members.map(member => {
		const memberAttendances = attendances.filter(a => a.memberId === member.id)
		const previousMemberAttendances = previousAttendances.filter(
			a => a.memberId === member.id,
		)

		const previousMonthAttendances = previousMemberAttendances.filter(a =>
			previousMonthSundays.some(
				sunday => startOfDay(a.date).getTime() === startOfDay(sunday).getTime(),
			),
		)

		return {
			...member,
			previousMonthAttendanceResume: calculateMonthlyResume(
				previousMonthAttendances,
			),
			currentMonthAttendanceResume: calculateMonthlyResume(
				memberAttendances.filter(a =>
					currentMonthSundays.some(
						sunday =>
							startOfDay(a.date).getTime() === startOfDay(sunday).getTime(),
					),
				),
			),
			currentMonthAttendances: currentMonthSundays.map(sunday => {
				const attendance = memberAttendances.find(
					a => startOfDay(a.date).getTime() === startOfDay(sunday).getTime(),
				)
				return {
					sunday,
					churchPresence: attendance ? attendance.inChurch : null,
					hasConflict: attendance?.hasConflict ?? false,
					servicePresence: attendance?.inService ?? null,
					meetingPresence: attendance?.inMeeting ?? null,
				}
			}),
		}
	})
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
