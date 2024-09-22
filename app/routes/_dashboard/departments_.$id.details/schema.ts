import { z } from 'zod'
import {
	ACCEPTED_EXCEL_MIME_TYPES,
	PHONE_NUMBER_REGEX,
	PWD_ERROR_MESSAGE,
	PWD_REGEX,
} from '~/shared/constants'

export const paramsSchema = z.object({
	take: z.number().optional().default(10),
	page: z.number().default(1),
	state: z.string().optional(),
	status: z.string().optional(),
	from: z.string().optional(),
	to: z.string().optional(),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})

export const createMemberSchema = z.object({
	name: z.string({ required_error: 'Veuillez saisir le nom & prenoms' }),
	location: z.string({ required_error: 'La localisation est requise' }),
	phone: z
		.string({ required_error: 'Veuillez entrer un numéro de téléphone' })
		.regex(PHONE_NUMBER_REGEX, {
			message: 'Numéro de téléphone invalide',
		}),
})

export const addAssistantSchema = z.object({
	memberId: z.string({ required_error: 'Veuillez sélectionner un assistant' }),
	password: z
		.string({
			required_error: PWD_ERROR_MESSAGE.min,
		})
		.min(8, PWD_ERROR_MESSAGE.min)
		.regex(PWD_REGEX, PWD_ERROR_MESSAGE.invalid),
})

export const uploadMemberSchema = z.object({
	file: z
		.instanceof(File)
		.optional()
		.refine(
			file => (file ? ACCEPTED_EXCEL_MIME_TYPES.includes(file.type) : true),
			'Le fichier doit être de type Excel (.xlsx ou .xls)',
		),
})
