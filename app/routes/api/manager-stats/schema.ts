import { startOfMonth, endOfMonth } from 'date-fns'
import { z } from 'zod'

export const schema = z.object({
	from: z.string().default(startOfMonth(new Date()).toISOString()),
	to: z.string().default(endOfMonth(new Date()).toISOString()),
})
