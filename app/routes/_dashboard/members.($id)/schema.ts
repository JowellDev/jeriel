import { z } from 'zod'
import { endOfMonth, startOfMonth } from 'date-fns'
import { PHONE_NUMBER_REGEX, SELECT_ALL_OPTION } from '~/shared/constants'
import { AttendanceState, MemberStatus } from '~/shared/enum'

export const paramsSchema = z.object({
	take: z.number().default(15),
	page: z.number().default(1),
	tribeId: z.string().optional(),
	departmentId: z.string().optional(),
	honorFamilyId: z.string().optional(),
	from: z.string().default(startOfMonth(new Date()).toISOString()),
	to: z.string().default(endOfMonth(new Date()).toISOString()),
	state: z
		.enum([SELECT_ALL_OPTION.value, ...Object.keys(AttendanceState)])
		.default(SELECT_ALL_OPTION.value),
	status: z
		.enum([SELECT_ALL_OPTION.value, ...Object.keys(MemberStatus)])
		.default(SELECT_ALL_OPTION.value),
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
	.refine(data => !data.file, {
		message: 'Veuillez ajouter des membres',
		path: ['members'],
	})
