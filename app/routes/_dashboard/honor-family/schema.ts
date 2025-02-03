import { z } from 'zod'
import { STATUS } from './constants'
import {
	ACCEPTED_EXCEL_MIME_TYPES,
	DEFAULT_QUERY_TAKE,
	PHONE_NUMBER_REGEX,
	PWD_REGEX,
} from '~/shared/constants'
import { endOfMonth, startOfMonth } from 'date-fns'

export const filterSchema = z.object({
	state: z.string().optional(),
	status: z.enum([STATUS.ALL, STATUS.NEW, STATUS.OLD]).optional(),
	from: z.string().default(startOfMonth(new Date()).toISOString()),
	to: z.string().default(endOfMonth(new Date()).toISOString()),
})

export const paramsSchema = z
	.object({
		take: z.number().optional().default(DEFAULT_QUERY_TAKE),
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
})

export const addAssistantSchema = z.object({
	memberId: z.string({
		required_error: 'Veuillez sélectionner un assistant',
	}),
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
		.instanceof(File)
		.optional()
		.refine(
			file => (file ? ACCEPTED_EXCEL_MIME_TYPES.includes(file.type) : true),
			'Le fichier doit être de type Excel (.xlsx ou .xls)',
		),
})
