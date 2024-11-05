import { type z } from 'zod'
import { type filterSchema } from './schema'

export type ServiceFilterOptions = z.infer<typeof filterSchema>

export interface ServiceData {
	id: string
	from: Date
	to: Date
	entity: {
		type: 'department' | 'tribe'
		name: string
		manager: {
			name: string
			phone: string
		} | null
	}
}
