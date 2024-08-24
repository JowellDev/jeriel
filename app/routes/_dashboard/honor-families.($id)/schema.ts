import { z } from 'zod'

export const querySchema = z.object({
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})
