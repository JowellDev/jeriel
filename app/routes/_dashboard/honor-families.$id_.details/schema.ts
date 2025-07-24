import { z } from 'zod'
import {
	PWD_REGEX,
	DEFAULT_QUERY_TAKE,
	PHONE_NUMBER_REGEX,
	ACCEPTED_EXCEL_MIME_TYPES,
} from '~/shared/constants'
import { STATUS } from './constants'
import { endOfMonth, startOfMonth } from 'date-fns'
import { imageValidationSchema } from '~/shared/schema'

export const filterSchema = z.object({
	state: z.string().optional(),
	status: z.enum([STATUS.ALL, STATUS.NEW, STATUS.OLD]).optional(),
	from: z.string().default(startOfMonth(new Date()).toISOString()),
	to: z.string().default(endOfMonth(new Date()).toISOString()),
})

export const paramsSchema = z
	.object({
		take: z.number().optional().default(DEFAULT_QUERY_TAKE),
		page: z.number().default(1),
		state: z.string().optional(),
		status: z.string().optional(),
		query: z
			.string()
			.trim()
			.optional()
			.transform(v => v ?? ''),
	})
	.merge(filterSchema)

export const createMemberSchema = z.object({
	name: z.string({ required_error: 'Veuillez saisir le nom & prenoms' }),
	location: z.string({ required_error: 'La localisation est requise' }),
	phone: z
		.string({ required_error: 'Veuillez entrer un numéro de téléphone' })
		.regex(PHONE_NUMBER_REGEX, {
			message: 'Numéro de numéro invalide',
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
			required_error: 'Le mot de passe doit contenir au moins 8 caractères',
		})
		.min(8, 'Le mot de passe doit contenir au moins 8 caractères')
		.regex(
			PWD_REGEX,
			'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial',
		)
		.optional(),
})

export const uploadMemberSchema = z.object({
	file: z
		.instanceof(File, { message: 'Veuillez sélectionner un fichier' })
		.refine(
			file => (file ? ACCEPTED_EXCEL_MIME_TYPES.includes(file.type) : true),
			'Le fichier doit être de type Excel (.xlsx ou .xls)',
		),
})
