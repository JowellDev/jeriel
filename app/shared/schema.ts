import { z } from 'zod'
import {
	ACCEPTED_EXCEL_MIME_TYPES,
	DEFAULT_QUERY_TAKE,
	PHONE_NUMBER_REGEX,
} from './constants'
import { startOfMonth, endOfMonth } from 'date-fns'

export const filterSchema = z.object({
	take: z.number().optional().default(DEFAULT_QUERY_TAKE),
	page: z.number().default(1),
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

export const imageValidationSchema = z
	.instanceof(File, { message: 'Sélectionnez une image' })
	.superRefine((file, ctx) => {
		const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
		const maxSize = 100 * 1024 * 1024

		if (!allowedTypes.includes(file.type)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Sélectionnez un fichier PNG ou JPEG',
				path: [''],
			})
		}

		if (file.size > maxSize) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "L'image ne doit pas excéder 100 Mo",
				path: [''],
			})
		}
	})

export const createEntityMemberSchema = z.object({
	name: z.string({ required_error: 'Veuillez saisir le nom & prénoms' }),
	location: z.string({ required_error: 'La localisation est requise' }),
	birthday: z.date().optional(),
	picture: imageValidationSchema.optional(),
	gender: z.enum(['F', 'M']).optional(),
	maritalStatus: z
		.enum([
			'SINGLE',
			'ENGAGED',
			'COHABITING',
			'MARRIED',
			'DIVORCED',
			'WIDOWER',
			'WIDOW',
		])
		.optional(),
	email: z
		.string()
		.email('Veuillez entrer une adresse email valide')
		.optional(),
	phone: z
		.string()
		.regex(PHONE_NUMBER_REGEX, {
			message: 'Numéro de téléphone invalide',
		})
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
