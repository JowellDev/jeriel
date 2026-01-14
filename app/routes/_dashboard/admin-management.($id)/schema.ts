import { z } from 'zod'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'

export const filterSchema = z.object({
	take: z.number().default(DEFAULT_QUERY_TAKE),
	page: z.number().default(1),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
	status: z.enum(['all', 'active', 'inactive']).default('all'),
})

export const addAdminSchema = z.object({
	userId: z.string({ required_error: 'Veuillez sélectionner un fidèle' }),
	email: z.string().email('Adresse email invalide').optional(),
	password: z.string().optional(),
})

export const removeAdminSchema = z.object({
	userId: z.string({ required_error: 'ID utilisateur requis' }),
})

export const resetPasswordSchema = z.object({
	userId: z.string({ required_error: 'ID utilisateur requis' }),
	password: z
		.string({ required_error: 'Le mot de passe est requis' })
		.min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

export type FilterOptions = z.infer<typeof filterSchema>
export type AddAdminData = z.infer<typeof addAdminSchema>
export type RemoveAdminData = z.infer<typeof removeAdminSchema>
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>
