import { type z } from 'zod'
import { type filterSchema } from './schema'

export type ServiceFilterOptions = z.infer<typeof filterSchema>

export interface ServiceData {
	id: string
	start: Date
	end: Date
}
export interface TribeServiceData extends ServiceData {
	tribe: {
		name: string
		manager: {
			name: string
			phone: string
		}
	}
}

export interface DepartmentServiceData extends ServiceData {
	department: {
		name: string
		manager: {
			name: string
			phone: string
		}
	}
}
