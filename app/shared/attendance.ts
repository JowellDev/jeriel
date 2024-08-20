export interface MonthlyAttendance {
	attendace: number
	sundays: number
}

export enum AttendanceStatusEnum {
	VERY_REGULAR = 'VERY_REGULAR',
	REGULAR = 'REGULAR',
	MEDIUM_REGULAR = 'MEDIUM_REGULAR',
	LITTLE_REGULAR = 'LITTLE_REGULAR',
	ABSENT = 'ABSENT',
}

export const frenchAttendanceStatus: Record<AttendanceStatusEnum, string> = {
	VERY_REGULAR: 'Tres régulier',
	REGULAR: 'Régulier',
	MEDIUM_REGULAR: 'Moyennement régulier',
	LITTLE_REGULAR: 'Peu régulier',
	ABSENT: 'Absent',
}

export const attendanceEmoji: Record<AttendanceStatusEnum, string> = {
	VERY_REGULAR: '🤩',
	REGULAR: '😇',
	MEDIUM_REGULAR: '😊',
	LITTLE_REGULAR: '😐',
	ABSENT: '😭',
}

export function getMonthlyAttendanceStatus(attendance: MonthlyAttendance) {
	const { attendace, sundays } = attendance
	const percentage = (attendace / sundays) * 100

	switch (true) {
		case percentage === 100:
			return AttendanceStatusEnum.VERY_REGULAR
		case percentage >= 60 && percentage < 100:
			return AttendanceStatusEnum.REGULAR
		case percentage >= 50 && percentage < 60:
			return AttendanceStatusEnum.MEDIUM_REGULAR
		case percentage < 50 && percentage > 0:
			return AttendanceStatusEnum.LITTLE_REGULAR
		default:
			return AttendanceStatusEnum.ABSENT
	}
}
