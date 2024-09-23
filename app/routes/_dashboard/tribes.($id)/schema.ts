import { z } from 'zod'
import {
	ACCEPTED_EXCEL_MIME_TYPES,
	PHONE_NUMBER_REGEX,
} from '~/shared/constants'

export const createTribeSchema = z.object({
	name: z.string({ required_error: 'Veuillez saisir le nom & prenoms' }),
	tribeManagerId: z.string({
		required_error: 'Veuillez sélectionner un responsable de la tribu',
	}),
	password: z.string().optional(),
	memberIds: z
		.string()
		.transform(ids => JSON.parse(ids) as string[])
		.optional(),
	membersFile: z
		.instanceof(File)
		.optional()
		.refine(
			file => (file ? ACCEPTED_EXCEL_MIME_TYPES.includes(file.type) : true),
			'Le fichier doit être de type Excel (.xlsx ou .xls)',
		),
})

export const memberSchema = z.object({
	name: z.string(),
	phone: z.string().regex(PHONE_NUMBER_REGEX, {
		message: 'Numéro de numéro invalide',
	}),
	location: z.string(),
})

export const querySchema = z.object({
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})
