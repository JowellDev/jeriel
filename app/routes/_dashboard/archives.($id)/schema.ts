import { z } from 'zod'

export const archiveUserSchema = z.object({
	usersToArchive: z
		.string({ required_error: 'Veuillez faire au moins une sélection' })
		.transform(v => v.split(';')),
	requesterId: z.string().optional(),
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
