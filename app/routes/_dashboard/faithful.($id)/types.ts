export interface Fairthful {
	id: string
	name: string
	phone: string
	location: string
	createdAt: Date
}

export interface MonthlyAttendance {
	attendace: number
	sundays: number
}

export interface FairthfulWithMonthlyAttendances extends Fairthful {
	lastMonthAttendanceResume: MonthlyAttendance
	currentMonthAttendanceResume: MonthlyAttendance
	currentMonthAttendances: { sunday: Date; isPresent: boolean }[]
}
