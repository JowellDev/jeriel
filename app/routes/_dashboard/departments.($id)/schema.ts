import { z } from 'zod'
import { PWD_REGEX } from '~/shared/constants'

const commonSchema = z.object({
	name: z.string({ required_error: 'Le nom ne peut pas être vide' }).trim(),
	managerId: z.string({
		required_error: 'Veuillez sélectionner un responsable',
	}),
	members: z
		.string({ required_error: 'Veuillez ajouter au moins un membre' })
		.transform(ids => JSON.parse(ids) as string[]),
})

export const createDepartmentSchema = commonSchema
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

export const updateDepartmentSchema = commonSchema
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
