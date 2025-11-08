import { type Role } from '@prisma/client'

export interface ChartConfig {
	[key: string]: {
		label: string
		value?: number
		color?: string
	}
}

export interface User {
	name: string
	email: string | null
	phone: string | null
	id: string
	isAdmin: boolean
	isActive: boolean
	location: string | null
	roles: Role[]
	createdAt: Date | string
	updatedAt: Date | string
	deletedAt: Date | string | null
	churchId: string | null
	tribeId: string | null
	honorFamilyId: string | null
	departmentId: string | null
	tribe: { name: string } | null
	department: { name: string } | null
	honorFamily: { name: string } | null
}

export type EntityType = 'tribe' | 'department' | 'honorFamily'

export interface AuthorizedEntity {
	type: EntityType
	id: string
	name?: string
}

export interface AttendanceAdminStats {
	month: string
	presences: number
	absences: number
}

export interface EntityData {
	member: string
	members: number
	fill: string
}

export interface ChartConfigItem {
	label: string
	color: string
	value?: number
}

export interface LineChartConfig {
	[key: string]: {
		label: string
		color: string
	}
}

export interface PieChartConfig {
	[key: string]: {
		label: string
		color: string
		value: number
	}
}

export interface EntityStats {
	totalMembers: number
	newMembers: number
	oldMembers: number
	departments: EntityWithStats[]
	tribes: EntityWithStats[]
	honorFamilies: EntityWithStats[]
}

export interface EntityWithStats {
	id: string
	name: string
	totalMembers: number
	newMembers: number
	oldMembers: number
}

export interface PieChartData {
	data: Array<{
		member: string
		members: number
		fill: string
	}>
	config: {
		nouveaux: {
			label: string
			color: string
			value: number
		}
		anciens: {
			label: string
			color: string
			value: number
		}
	}
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

export interface FilterData {
	entity: 'CULTE' | 'TRIBE' | 'DEPARTMENT' | 'HONOR_FAMILY'
	firstDateFrom: string
	firstDateTo: string
	secondDateFrom: string
	secondDateTo: string
}
