import { z } from 'zod'
import { PHONE_NUMBER_REGEX, PWD_REGEX } from '~/shared/constants'

const commonSchema = z.object({
	churchName: z
		.string({ required_error: "Le nom de l'église ne peut pas être vide" })
		.trim(),

	name: z.string({ required_error: 'Le nom ne peut pas être vide' }).trim(),

	adminPhone: z.string().regex(PHONE_NUMBER_REGEX, {
		message: 'Veuillez entrer un numéro de téléphone valide',
	}),
})

export const createChurchSchema = commonSchema
	.extend({
		password: z
			.string({
				required_error: 'Le mot de passe doit contenir au moins 8 caractères',
			})
			.min(8, 'Le mot de passe doit contenir au moins 8 caractères')
			.regex(
				PWD_REGEX,
				'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial',
			),

		passwordConfirm: z.string({
			required_error: 'Le mot de passe doit contenir au moins 8 caractères',
		}),
	})
	.refine(data => data.password === data.passwordConfirm, {
		message: 'Les mots de passe ne correspondent pas',
		path: ['passwordConfirm'],
	})

export const updateChurchSchema = commonSchema
	.extend({
		password: z
			.string()
			.min(8, 'Le mot de passe doit contenir au moins 8 caractères')
			.regex(
				PWD_REGEX,
				'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial',
			)
			.optional(),

		passwordConfirm: z.string().optional(),
	})
	.refine(
		data => {
			if (data.password || data.passwordConfirm) {
				return data.password === data.passwordConfirm
			}
			return true
		},
		{
			message: 'Les mots de passe ne correspondent pas',
			path: ['passwordConfirm'],
		},
	)

export const querySchema = z.object({
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})
