import type { Role } from '@prisma/client'

export interface AdminUser {
	id: string
	name: string
	email: string | null
	phone: string | null
	location: string | null
	isActive: boolean
	roles: Role[]
	createdAt: Date
	church: {
		id: string
		name: string
	} | null
	tribe: { id: string; name: string } | null
	department: { id: string; name: string } | null
	honorFamily: { id: string; name: string } | null
}

export interface FilterOptions {
	take: number
	page: number
	query: string
	status: 'all' | 'active' | 'inactive'
}
