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
	previousMonthMeetingResume: MonthlyAttendance | null
	currentMonthMeetingResume: MonthlyAttendance | null

	currentMonthAttendances: {
		sunday: Date | string
		churchPresence: boolean | null
		servicePresence: boolean | null
		hasConflict: boolean
	}[]

	currentMonthMeetings: {
		date: Date | string
		meetingPresence: boolean | null
		hasConflict: boolean
	}[]
}

export type AttendanceChartDataType = {
	month: string
	sunday: number
	service: number
}

export type MemberWithAttendances = MemberWithRelations & {
	attendances: AttendanceDetails[]
}

interface AttendanceDetails {
	date: Date | string
	inChurch: boolean | null
	inService: boolean | null
	inMeeting: boolean | null
	report: {
		entity: 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY'
	}
}
