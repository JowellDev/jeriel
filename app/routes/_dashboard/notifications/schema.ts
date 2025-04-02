import { z } from 'zod'
import { DEFAULT_QUERY_TAKE } from './constants'

export const filterSchema = z.object({
	take: z.number().default(DEFAULT_QUERY_TAKE),
	page: z.number().default(1),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
	filter: z.enum(['all', 'unread']).default('all'),
})

export type FilterOption = z.infer<typeof filterSchema>
