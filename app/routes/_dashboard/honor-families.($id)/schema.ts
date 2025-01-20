import { z } from 'zod'
import {
	ACCEPTED_EXCEL_MIME_TYPES,
	DEFAULT_QUERY_TAKE,
	PHONE_NUMBER_REGEX,
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
		required_error: 'Veuillez saisir le nom de la famille d’honneur',
	}),
	location: z.string({ required_error: 'Veuillez saisir la localisation' }),
	managerId: z.string({
		required_error: 'Veuillez sélectionner un responsable',
	}),
	password: z.string().optional(),
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
		message: 'Numéro de numéro invalide',
	}),
	location: z.string(),
})

export const editHonorFamilySchema = z.object({
	name: z.string({
		required_error: "Le nom de la famille d'honneur est requis",
	}),
	location: z.string({ required_error: 'La localisation est requise' }),
	managerId: z.string({ required_error: 'Selectionner un responsable' }),
	password: z.string().optional(),
	membersId: z
		.string()
		.transform(data => JSON.parse(data) as string[])
		.optional(),
	membersFile: z
		.instanceof(File)
		.optional()
		.refine(file => {
			if (file) {
				return [
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					'application/vnd.ms-excel',
				].includes(file.type)
			}
			return true
		}, 'Le fichier doit être de type Excel (.xlsx ou .xls)'),
})
