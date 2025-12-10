import { endOfMonth } from 'date-fns'
import { z } from 'zod'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'

export const filterSchema = z.object({
	take: z.number().default(DEFAULT_QUERY_TAKE),
	page: z.number().default(1),
	from: z.string().optional(),
	to: z.string().default(endOfMonth(new Date()).toISOString()),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})

export type FilterOption = z.infer<typeof filterSchema>
