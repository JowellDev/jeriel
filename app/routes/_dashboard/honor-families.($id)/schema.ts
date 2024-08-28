import { z } from 'zod'

export const querySchema = z.object({
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})

export const createHonorFamilySchema = z.object({
	name: z.string({
		required_error: "Le nom de la famille d'honneur est requis",
	}),
	location: z.string({ required_error: 'La localisation est requise' }),
	managerId: z.string({ required_error: 'Selectionner un responsable' }),
	password: z.string({ required_error: 'Le mot de passe est requis' }),
	members: z
		.string()
		.transform(data => JSON.parse(data) as string[])
		.optional(),
})
