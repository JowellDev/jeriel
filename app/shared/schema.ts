import { z } from 'zod'
import { DEFAULT_QUERY_TAKE } from './constants'
import { startOfMonth, endOfMonth } from 'date-fns'

export const filterSchema = z.object({
	take: z.number().optional().default(DEFAULT_QUERY_TAKE),
	page: z.number().default(1),
	state: z.string().optional(),
	status: z.string().optional(),
	from: z.string().default(startOfMonth(new Date()).toISOString()),
	to: z.string().default(endOfMonth(new Date()).toISOString()),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})
