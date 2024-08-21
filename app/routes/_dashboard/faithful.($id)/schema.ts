import { z } from 'zod'
import { PHONE_NUMBER_REGEX } from '~/shared/constants'

export const createFaithfulSchema = z.object({
	name: z.string({ required_error: 'Veuillez le nom & prenoms' }),
	location: z.string({ required_error: 'La localisation est requise' }),
	phone: z
		.string({ required_error: 'Le numéro de numéro est requis' })
		.regex(PHONE_NUMBER_REGEX, {
			message: 'Veuillez entrer un numéro de numéro valide',
		}),
	tribeId: z.string().optional(),
	departmentId: z.string().optional(),
	honorFamilyId: z.string().optional(),
})
