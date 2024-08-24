import { z } from 'zod'
import { PWD_REGEX } from '~/shared/constants'

export const CreateTribeSchema = z.object({
	name: z.string({ required_error: 'Veuillez saisir le nom & prenoms' }),
	managerTibeId: z.string({
		required_error: 'Veuillez sélectionner un responsable de la tribu',
	}),
	password: z
		.string({ required_error: 'Veuillez définir un mot de passe' })
		.min(8, 'Le mot de passe doit contenir au moins 8 caractères')
		.regex(
			PWD_REGEX,
			'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spéciaux',
		),
	memberIds: z
		.string({
			required_error: 'Veuillez sélectionner au moins un fidèle',
		})
		.transform(ids => JSON.parse(ids)),
})
