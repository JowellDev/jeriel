import { type MonthlyAttendance } from '~/shared/attendance'

export interface Member {
	id: string
	name: string
	phone: string
	location: string | null
	createdAt: Date
}

export interface MemberWithRelations extends Member {
	tribe: { name: string } | null
	department: { name: string } | null
	honorFamily: { name: string } | null
}

export interface MemberMonthlyAttendances extends Member {
	previousMonthAttendanceResume: MonthlyAttendance | null
	currentMonthAttendanceResume: MonthlyAttendance | null
	currentMonthAttendances: { sunday: Date; isPresent: boolean | null }[]
}
