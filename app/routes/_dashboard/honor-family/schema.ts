import { startOfMonth, endOfMonth } from 'date-fns'
import { z } from 'zod'

export const filterSchema = z.object({
	state: z.string().optional(),
	status: z.string().optional(),
})

export const paramsSchema = z
	.object({
		take: z.number().optional().default(10),
		page: z.number().default(1),
		from: z.string().default(startOfMonth(new Date()).toISOString()),
		to: z.string().default(endOfMonth(new Date()).toISOString()),
		query: z
			.string()
			.trim()
			.optional()
			.transform(v => v ?? ''),
	})
	.merge(filterSchema)
