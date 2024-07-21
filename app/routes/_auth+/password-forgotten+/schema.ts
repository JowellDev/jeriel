import { z } from 'zod'

export const schema = z.object({
	email: z
		.string({ required_error: 'Veuillez entrer votre adresse e-mail' })
		.email('Adresse e-mail invalide'),
})
