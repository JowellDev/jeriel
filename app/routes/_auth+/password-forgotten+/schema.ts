import { z } from 'zod'
import { PHONE_NUMBER_REGEX } from '~/shared/constants'

export const schema = z.object({
	phone: z
		.string({
			required_error: 'Veuillez entrer votre numéro de téléphone',
		})
		.regex(PHONE_NUMBER_REGEX, {
			message: 'Numéro de téléphone invalide',
		}),
})
