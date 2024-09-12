import { AttendanceState } from './enum'

export interface MonthlyAttendance {
	attendance: number
	sundays: number
}

export function getMonthlyAttendanceState(data: MonthlyAttendance) {
	const { attendance, sundays } = data
	const percentage = (attendance / sundays) * 100

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
