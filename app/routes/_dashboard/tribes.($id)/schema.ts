import { z } from 'zod'
import {
	ACCEPTED_EXCEL_MIME_TYPES,
	DEFAULT_QUERY_TAKE,
	PHONE_NUMBER_REGEX,
} from '~/shared/constants'

const baseTribeSchema = z.object({
	name: z.string({ required_error: 'Veuillez saisir le nom & prenoms.' }),
	tribeManagerId: z.string({
		required_error: 'Veuillez sélectionner le responsable de la tribu.',
	}),
	tribeManagerEmail: z
		.string()
		.email('Veuillez entrer une adresse email valide.')
		.optional(),
	password: z.string().optional(),
})

export const editTribeSchema = baseTribeSchema
	.extend({
		selectionMode: z.enum(['manual', 'file']),
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
	.refine(
		data => {
			if (data.selectionMode === 'manual' && !data.memberIds) {
				return false
			}
			if (data.selectionMode === 'file' && !data.membersFile) {
				return false
			}
			return true
		},
		{
			message: 'Veuillez ajouter des membres',
			path: ['memberIds'],
		},
	)

export const memberSchema = z.object({
	name: z.string(),
	location: z.string(),
	email: z
		.string()
		.email('Veuillez entrer une adresse email valide.')
		.optional(),
	phone: z
		.string()
		.regex(PHONE_NUMBER_REGEX, {
			message: 'Veuillez entrer un numéro de téléphone valide',
		})
		.optional(),
})

export const querySchema = z.object({
	take: z.number().default(DEFAULT_QUERY_TAKE),
	page: z.number().default(1),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})

export type FilterOption = z.infer<typeof querySchema>
