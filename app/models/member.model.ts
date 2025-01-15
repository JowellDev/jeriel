import { type MonthlyAttendance } from '~/shared/attendance'

export interface Member {
	id: string
	name: string
	phone: string
	location: string | null
	createdAt: Date | string
	integrationDate: IntegrationDate | null
}

export interface IntegrationDate {
	id: string
	tribeDate: Date | null
	familyDate: Date | null
	departementDate: Date | null
}

export interface MemberWithRelations extends Member {
	tribe: { id: string; name: string } | null
	department: { id: string; name: string } | null
	honorFamily: { id: string; name: string } | null
}

export interface MemberMonthlyAttendances extends Member {
	previousMonthAttendanceResume: MonthlyAttendance | null
	currentMonthAttendanceResume: MonthlyAttendance | null
	currentMonthAttendances: { sunday: Date; isPresent: boolean | null }[]
}
