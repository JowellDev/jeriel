export type EntityType = 'tribe' | 'department' | 'honorFamily'

export interface AuthorizedEntity {
	type: EntityType
	id: string
	name?: string
}

export interface Member {
	id: string
	name: string
	createdAt: Date | string
	tribeId?: string
	departmentId?: string
	honorFamilyId?: string
}

export interface Attendance {
	id: string
	memberId: string
	date: Date | string
	inChurch: boolean | null
	inService: boolean | null
	inMeeting: boolean | null
}

export interface AttendanceReport {
	id: string
	entity: EntityType
	comment: string | null
	createdAt: Date | string
	departmentId: string | null
	tribeId: string | null
	honorFamilyId: string | null
	submitterId: string
	attendances: Attendance[]
}

export interface AttendanceStats {
	culte: CategoryStats
	service: CategoryStats
	reunion: CategoryStats
}

export interface CategoryStats {
	averageGeneralAttendance: number
	averageNewMembersAttendance: number
	averageOldMembersAttendance: number
	averageGeneralAbsence: number
	averageNewMembersAbsence: number
	averageOldMembersAbsence: number
}
