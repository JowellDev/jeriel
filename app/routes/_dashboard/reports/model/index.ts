import type { AttendanceReportEntity } from '@prisma/client'

export interface Manager {
	name: string
	phone: string
}

type Entity = {
	name: string
	manager: Manager
}

export type AttendanceData = {
	member: { name: string }
	memberId: string
	inChurch?: boolean
	inService?: boolean | null
	inMeeting?: boolean | null
	date: Date | string
}

export type EntityType = 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY' | 'ALL'

export type AttendanceReport = {
	id: string
	entity: EntityType
	comment: string | null
	createdAt: Date | string
	departmentId: string | null
	tribeId: string | null
	honorFamilyId: string | null
	submitterId: string
	tribe: Entity | null
	department: Entity | null
	honorFamily: Entity | null
	attendances: AttendanceData[]
}

export interface MemberWithAttendancesConflicts {
	id: string
	name: string
	createdAt: Date | string
	attendances: AttendanceConflicts[]
}

export interface AttendanceConflicts {
	id: string
	date: Date | string
	inChurch: boolean
	hasConflict: boolean
	report: {
		entity: AttendanceReportEntity
		tribe: { name: string } | null
		department: { name: string } | null
	}
}

export type MembersConflictsByDate = {
	date: string
	members: MemberWithAttendancesConflicts[]
}
