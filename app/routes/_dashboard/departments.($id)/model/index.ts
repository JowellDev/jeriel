import { CreateDepartmentFormData, UpdateDepartmentFormData } from '../schema'

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
