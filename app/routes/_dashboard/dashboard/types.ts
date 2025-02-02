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
	phone: string
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
