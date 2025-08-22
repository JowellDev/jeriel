import { endOfWeek, startOfWeek } from 'date-fns'
import { z } from 'zod'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'

export const filterSchema = z.object({
	from: z
		.string()
		.default(startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()),
	to: z
		.string()
		.default(endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString()),
	take: z.number().default(DEFAULT_QUERY_TAKE),
	page: z.number().default(1),
})

export type FilterSchema = z.infer<typeof filterSchema>
