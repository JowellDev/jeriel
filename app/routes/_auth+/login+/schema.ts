import { z } from 'zod'

export const schema = z.object({
	phone: z
		.string({
			required_error: 'Veuillez entrer votre numéro de téléphone',
		})
		.regex(/^\d{10}$/, {
			message: 'Numéro de téléphone invalide',
		}),
	password: z.string({ required_error: 'Veuillez entrer votre mot de passe' }),
	redirectTo: z.string({ required_error: 'URL de redirection requise' }),
	remember: z.boolean().optional(),
})
