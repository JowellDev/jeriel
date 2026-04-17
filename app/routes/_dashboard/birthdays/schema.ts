import { endOfMonth, startOfMonth } from 'date-fns'
import { z } from 'zod'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'

export const filterSchema = z.object({
	from: z
		.string()
		.default(startOfMonth(new Date()).toISOString()),
	to: z
		.string()
		.default(endOfMonth(new Date()).toISOString()),
	take: z.number().default(DEFAULT_QUERY_TAKE),
	page: z.number().default(1),
	tab: z.enum(['general', 'week']).default('general'),
})

export type FilterSchema = z.infer<typeof filterSchema>
