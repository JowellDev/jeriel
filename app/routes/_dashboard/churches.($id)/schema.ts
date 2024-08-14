import { z } from 'zod'

const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/

const commonSchema = z.object({
	churchName: z
		.string({ required_error: "Le nom de l'église ne peut pas être vide" })
		.trim(),

	adminFullname: z
		.string({ required_error: 'Le nom complet ne peut pas être vide' })
		.trim(),

	adminPhone: z.string().regex(/^\d{10}$/, {
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
				pwdRegex,
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
				pwdRegex,
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
