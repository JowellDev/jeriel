import { z } from 'zod'

export const archiveUserSchema = z.object({
	usersToArchive: z.string().transform(v => v.split(';')),
})

export const querySchema = z.object({
	take: z.number().default(10),
	page: z.number().default(1),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})

export type FilterOption = z.infer<typeof querySchema>
