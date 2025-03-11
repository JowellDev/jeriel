import { startOfMonth, endOfMonth } from 'date-fns'
import { z } from 'zod'

export const statsSchema = z.object({
	tribeId: z.string(),
	from: z.string().default(startOfMonth(new Date()).toISOString()),
	to: z.string().default(endOfMonth(new Date()).toISOString()),
})
