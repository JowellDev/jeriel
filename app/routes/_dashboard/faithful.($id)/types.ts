import { type MonthlyAttendance } from '~/shared/attendance'

export interface Fairthful {
	id: string
	name: string
	phone: string
	location: string
	createdAt: Date
}

export interface FairthfulWithMonthlyAttendances extends Fairthful {
	lastMonthAttendanceResume: MonthlyAttendance
	currentMonthAttendanceResume: MonthlyAttendance
	currentMonthAttendances: { sunday: Date; isPresent?: boolean }[]
}
