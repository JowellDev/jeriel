import { z } from 'zod'
import {
	PHONE_NUMBER_REGEX,
	PWD_ERROR_MESSAGE,
	PWD_REGEX,
} from '~/shared/constants'

const commonSchema = z.object({
	churchName: z
		.string({ required_error: "Veuillez entrer le nom de l'église" })
		.trim(),
	smsEnabled: z
		.enum(['0', '1'])
		.default('0')
		.transform(v => v === '1'),
	admin: z.object({
		name: z
			.string({ required_error: "Veuillez entrer le nom de l'administrateur" })
			.trim(),
		email: z
			.string({ required_error: 'Veuillez entrer une adresse email' })
			.email('Veuillez entrer une adresse email valide'),
		phone: z
			.string({ required_error: 'Veuillez entrer un numéro de téléphone' })
			.regex(PHONE_NUMBER_REGEX, {
				message: 'Veuillez entrer un numéro de téléphone valide',
			}),
	}),
})

export const createChurchSchema = commonSchema
	.extend({
		password: z
			.string({
				required_error: PWD_ERROR_MESSAGE.min,
			})
			.min(8, PWD_ERROR_MESSAGE.min)
			.regex(PWD_REGEX, PWD_ERROR_MESSAGE.invalid),

		passwordConfirm: z.string({
			required_error: PWD_ERROR_MESSAGE.min,
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
			.min(8, PWD_ERROR_MESSAGE.min)
			.regex(PWD_REGEX, PWD_ERROR_MESSAGE.invalid)
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
