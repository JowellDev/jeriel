import { z } from 'zod'
import { DEFAULT_QUERY_TAKE } from './constants'

export const querySchema = z.object({
	take: z.number().optional().default(DEFAULT_QUERY_TAKE),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})
