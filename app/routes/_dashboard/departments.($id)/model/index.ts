import type { Prisma } from '@prisma/client'
import type {
	CreateDepartmentFormData,
	UpdateDepartmentFormData,
} from '../schema'
import type { EXPORT_DEPARTMENT_SELECT } from '../utils/server'

export interface Member {
	id: string
	name: string
	phone: string
}

export interface Department {
	id: string
	name: string
	manager: {
		id?: string
		name: string
		phone: string
		isAdmin: boolean
	}
	members: Member[]
	createdAt: string
}

export type DepartmentFormData =
	| CreateDepartmentFormData
	| UpdateDepartmentFormData

export type DepartmentExport = Prisma.DepartmentGetPayload<{
	select: typeof EXPORT_DEPARTMENT_SELECT
}>
