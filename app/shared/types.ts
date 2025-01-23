import type { z } from 'zod'
import type { filterSchema } from './schema'

export interface SelectOption {
	label: string
	value: string
}

export type MemberFilterOptions = z.infer<typeof filterSchema>
