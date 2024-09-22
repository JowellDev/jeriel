import { z } from 'zod'
import { PWD_ERROR_MESSAGE, PWD_REGEX } from '~/shared/constants'

export const schema = z
	.object({
		password: z
			.string({ required_error: 'Veuillez définir un mot de passe' })
			.min(8, PWD_ERROR_MESSAGE.min)
			.regex(PWD_REGEX, PWD_ERROR_MESSAGE.invalid),
		passwordConfirm: z.string(),
	})
	.refine(data => data.password === data.passwordConfirm, {
		message: 'Les mots de passe ne correspondent pas',
		path: ['passwordConfirm'],
	})
