import { endOfMonth, startOfMonth } from 'date-fns'
import { z } from 'zod'

export const schema = z.object({
	entity: z
		.enum(['CULTE', 'DEPARTMENT', 'TRIBE', 'HONOR_FAMILY'])
		.default('CULTE'),
	firstDateFrom: z.string().default(startOfMonth(new Date()).toISOString()),
	firstDateTo: z.string().default(endOfMonth(new Date()).toISOString()),
	secondDateFrom: z.string().default(startOfMonth(new Date()).toISOString()),
	secondDateTo: z.string().default(endOfMonth(new Date()).toISOString()),
})
