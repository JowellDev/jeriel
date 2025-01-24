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
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
	churchId: string | null
	tribeId: string | null
	honorFamilyId: string | null
	departmentId: string | null
}
