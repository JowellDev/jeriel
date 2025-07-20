import { startOfMonth, endOfMonth } from 'date-fns'
import { z } from 'zod'
import {
	ACCEPTED_EXCEL_MIME_TYPES,
	DEFAULT_QUERY_TAKE,
	PHONE_NUMBER_REGEX,
	PWD_ERROR_MESSAGE,
	PWD_REGEX,
} from '~/shared/constants'
import { imageValidationSchema } from '~/shared/schema'

export const filterSchema = z.object({
	state: z.string().optional(),
	status: z.string().optional(),
	from: z.string().default(startOfMonth(new Date()).toISOString()),
	to: z.string().default(endOfMonth(new Date()).toISOString()),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})

export const paramsSchema = z
	.object({
		take: z.number().optional().default(DEFAULT_QUERY_TAKE),
		page: z.number().default(1),
	})
	.merge(filterSchema)

export const createMemberSchema = z.object({
	name: z.string({ required_error: 'Veuillez saisir le nom & prenoms' }),
	location: z.string({ required_error: 'La localisation est requise' }),
	phone: z
		.string({ required_error: 'Veuillez entrer un numéro de téléphone' })
		.regex(PHONE_NUMBER_REGEX, {
			message: 'Numéro de téléphone invalide',
		}),
	birthday: z.date().optional(),
	picture: imageValidationSchema.optional(),
	gender: z.enum(['F', 'M']).optional(),
	maritalStatus: z
		.enum(['MARRIED', 'ENGAGED', 'WIDOWED', 'SINGLE', 'COHABITING'])
		.optional(),
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
