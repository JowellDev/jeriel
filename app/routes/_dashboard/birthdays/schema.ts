import { z } from 'zod'

export const querySchema = z.object({
	from: z.string(),
	to: z.string(),
})
