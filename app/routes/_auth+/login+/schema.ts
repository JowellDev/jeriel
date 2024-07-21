import { z } from 'zod'

export const schema = z.object({
	email: z
		.string({ required_error: 'Veuillez entrer votre adresse e-mail' })
		.email('Adresse e-mail invalide'),
	password: z.string({ required_error: 'Veuillez entrer votre mot de passe' }),
	redirectTo: z.string({ required_error: 'URL de redirection requise' }),
	remember: z.boolean().optional(),
})
