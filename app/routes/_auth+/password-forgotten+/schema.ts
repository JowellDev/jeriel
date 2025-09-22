import { z } from 'zod'

export const schema = z.object({
	email: z
		.string({ required_error: 'Veuillez entrer votre adresse email' })
		.email({ message: 'Veuillez entrer une adresse email valide' }),
})
