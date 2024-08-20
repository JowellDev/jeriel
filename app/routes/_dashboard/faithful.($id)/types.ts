import { type MonthlyAttendance } from '~/shared/attendance'

export interface Faithful {
	id: string
	name: string
	phone: string
	location: string
	createdAt: Date
}

export interface FaithfulWithMonthlyAttendances extends Faithful {
	lastMonthAttendanceResume: MonthlyAttendance
	currentMonthAttendanceResume: MonthlyAttendance
	currentMonthAttendances: { sunday: Date; isPresent?: boolean }[]
}
