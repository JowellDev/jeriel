import { z } from 'zod'
import { endOfMonth, startOfMonth } from 'date-fns'
import { DEFAULT_QUERY_TAKE, PHONE_NUMBER_REGEX } from '~/shared/constants'
import { imageValidationSchema } from '~/shared/schema'

export const filterSchema = z.object({
	take: z.number().default(DEFAULT_QUERY_TAKE),
	page: z.number().default(1),
	tribeId: z.string().optional(),
	departmentId: z.string().optional(),
	honorFamilyId: z.string().optional(),
	from: z.string().default(startOfMonth(new Date()).toISOString()),
	to: z.string().default(endOfMonth(new Date()).toISOString()),
	state: z.string().optional(),
	status: z.string().optional(),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})

export const editMemberSchema = z.object({
	name: z.string({ required_error: 'Veuillez saisir le nom & prenoms' }),
	location: z.string({ required_error: 'La localisation est requise' }),
	birthday: z.date().optional(),
	picture: imageValidationSchema.optional(),
	gender: z.enum(['F', 'M']).optional(),
	maritalStatus: z
		.enum(['MARRIED', 'ENGAGED', 'WIDOWED', 'SINGLE', 'COHABITING'])
		.optional(),
	email: z
		.string()
		.email('Veuillez entrer une adresse email valide')
		.optional(),
	phone: z
		.string()
		.regex(PHONE_NUMBER_REGEX, {
			message: 'Numéro de numéro invalide',
		})
		.optional(),
	tribeId: z.string().optional(),
	departmentId: z.string().optional(),
	honorFamilyId: z.string().optional(),
})

export const uploadMembersSchema = z
	.object({
		file: z.instanceof(File).optional(),
	})
	.refine(data => !!data.file, {
		message: 'Veuillez ajouter des membres',
		path: ['members'],
	})
