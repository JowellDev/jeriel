import { z } from 'zod'
import { endOfMonth, startOfMonth } from 'date-fns'
import { DEFAULT_QUERY_TAKE, PHONE_NUMBER_REGEX } from '~/shared/constants'

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
	phone: z
		.string({ required_error: 'Veuillez entrer un numéro de téléphone' })
		.regex(PHONE_NUMBER_REGEX, {
			message: 'Numéro de numéro invalide',
		}),
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
