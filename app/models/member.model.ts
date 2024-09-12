import { type MonthlyAttendance } from '~/shared/attendance'

export interface Member {
	id: string
	name: string
	phone: string
	location: string | null
	createdAt: Date
}

export interface MemberMonthlyAttendances extends Member {
	previousMonthAttendanceResume: MonthlyAttendance | null
	currentMonthAttendanceResume: MonthlyAttendance | null
	currentMonthAttendances: { sunday: Date; isPresent: boolean | null }[]
}
