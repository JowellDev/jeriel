import { z } from 'zod'
import {
	ACCEPTED_EXCEL_MIME_TYPES,
	DEFAULT_QUERY_TAKE,
	PHONE_NUMBER_REGEX,
	PWD_ERROR_MESSAGE,
	PWD_REGEX,
} from '~/shared/constants'

export const querySchema = z.object({
	take: z.number().optional().default(DEFAULT_QUERY_TAKE),
	query: z
		.string()
		.optional()
		.transform(v => v ?? ''),
})

const baseHonorFamilySchema = z.object({
	name: z.string({
		required_error: "Veuillez saisir le nom de la famille d'honneur",
	}),
	location: z.string({ required_error: 'Veuillez saisir la localisation' }),
	managerId: z.string({
		required_error: 'Veuillez sélectionner un responsable',
	}),
	managerEmail: z
		.string()
		.email('Veuillez entrer une adresse email valide.')
		.optional(),
	password: z
		.string({ required_error: PWD_ERROR_MESSAGE.min })
		.min(8, PWD_ERROR_MESSAGE.min)
		.regex(PWD_REGEX, PWD_ERROR_MESSAGE.invalid)
		.optional(),
})

export const createHonorFamilySchema = baseHonorFamilySchema
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
	phone: z.string().regex(PHONE_NUMBER_REGEX, {
		message: 'Numéro de téléphone invalide',
	}),
	location: z.string(),
})
