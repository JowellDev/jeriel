import { startOfMonth, endOfMonth } from 'date-fns'
import { z } from 'zod'
import {
	ACCEPTED_EXCEL_MIME_TYPES,
	DEFAULT_QUERY_TAKE,
	PWD_ERROR_MESSAGE,
	PWD_REGEX,
} from '~/shared/constants'
import { stateFilterData } from './constants'

export const paramsSchema = z.object({
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
	attendanceState: z
		.enum(['ALL', ...Object.values(stateFilterData).map(item => item.value)])
		.optional(),
})

export const addTribeAssistantSchema = z.object({
	memberId: z.string({ required_error: 'Veuillez sélectionner un assistant' }),
	email: z
		.string()
		.email('Veuillez entrer une adresse email valide.')
		.optional(),
	password: z
		.string({ required_error: PWD_ERROR_MESSAGE.min })
		.min(8, PWD_ERROR_MESSAGE.min)
		.regex(PWD_REGEX, PWD_ERROR_MESSAGE.invalid)
		.optional(),
})

export const uploadMemberSchema = z.object({
	file: z
		.instanceof(File)
		.refine(
			file => (file ? ACCEPTED_EXCEL_MIME_TYPES.includes(file.type) : true),
			'Le fichier doit être de type Excel (.xlsx ou .xls)',
		),
})

export const filterSchema = z.object({
	state: z.string().optional(),
	status: z.string().optional(),
})
