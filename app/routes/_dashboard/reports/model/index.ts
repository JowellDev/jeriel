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
}

export type EntityType = 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY'

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
