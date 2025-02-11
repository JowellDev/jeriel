import { type MonthlyAttendance } from '~/shared/attendance'

export interface Member {
	id: string
	name: string
	phone: string
	location: string | null
	createdAt: Date | string
	integrationDate: IntegrationDate | null
}

type NullableDate = Date | string | null

export interface IntegrationDate {
	id: string
	createdAt: Date | string
	tribeDate: NullableDate
	familyDate: NullableDate
	departementDate: NullableDate
	userId: string
}

export interface MemberWithRelations extends Member {
	tribe: { id: string; name: string } | null
	department: { id: string; name: string } | null
	honorFamily: { id: string; name: string } | null
}

export interface MemberMonthlyAttendances extends Member {
	previousMonthAttendanceResume: MonthlyAttendance | null
	currentMonthAttendanceResume: MonthlyAttendance | null
	currentMonthAttendances: {
		sunday: Date | string
		churchPresence: boolean | null
		servicePresence: boolean | null
		meetingPresence: boolean | null
		hasConflict: boolean | null
	}[]
}
