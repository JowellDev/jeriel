import { z } from 'zod'
import { DEFAULT_QUERY_TAKE } from './constants'
import { PHONE_NUMBER_REGEX, PWD_REGEX } from '~/shared/constants'

export const paramsSchema = z.object({
	take: z.number().optional().default(DEFAULT_QUERY_TAKE),
	page: z.number().default(1),
	state: z.string().optional(),
	status: z.string().optional(),
	from: z.string().optional(),
	to: z.string().optional(),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})

export const createMemberSchema = z.object({
	name: z.string({ required_error: 'Veuillez saisir le nom & prenoms' }),
	location: z.string({ required_error: 'La localisation est requise' }),
	phone: z
		.string({ required_error: 'Veuillez entrer un numéro de téléphone' })
		.regex(PHONE_NUMBER_REGEX, {
			message: 'Numéro de numéro invalide',
		}),
})

export const addTribeAssistantSchema = z.object({
	memberId: z.string({ required_error: 'Veuillez sélectionner un assistant' }),
	password: z
		.string({
			required_error: 'Le mot de passe doit contenir au moins 8 caractères',
		})
		.min(8, 'Le mot de passe doit contenir au moins 8 caractères')
		.regex(
			PWD_REGEX,
			'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial',
		),
})
