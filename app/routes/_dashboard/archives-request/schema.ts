import { z } from 'zod'

export const archiveUserSchema = z.object({
	origin: z.string({ required_error: 'Veuillez choisir une entité' }),
	usersToArchive: z
		.string({ required_error: 'Veuillez faire au moins une sélection' })
		.transform(v => v.split(';').filter(Boolean)),
})

export const deleteArchiveRequestSchema = z.object({
	requestId: z.string({ required_error: 'ID de la demande requis' }),
})

export const updateArchiveRequestSchema = z.object({
	requestId: z.string({ required_error: 'ID de la demande requis' }),
	usersToArchive: z
		.string({ required_error: 'Veuillez faire au moins une sélection' })
		.transform(v => v.split(';').filter(Boolean)),
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
