import { z } from 'zod'
import { PWD_REGEX } from '~/shared/constants'

export const schema = z
	.object({
		password: z
			.string({ required_error: 'Veuillez définir un mot de passe' })
			.min(8, 'Le mot de passe doit contenir au moins 8 caractères')
			.regex(
				PWD_REGEX,
				'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spéciaux',
			),
		passwordConfirm: z.string(),
	})
	.refine(data => data.password === data.passwordConfirm, {
		message: 'Les mots de passe ne correspondent pas',
		path: ['passwordConfirm'],
	})
