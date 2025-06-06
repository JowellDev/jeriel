import { type z } from 'zod'
import { type filterSchema } from './schema'

export type ServiceFilterOptions = z.infer<typeof filterSchema>

export interface ServiceData {
	id: string
	from: Date | string
	to: Date | string
	entity: {
		type: 'department' | 'tribe'
		id: string
		name: string
		manager: {
			name: string
			phone: string
		} | null
	}
}
