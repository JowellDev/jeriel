import { z } from 'zod'
import { PWD_REGEX } from '~/shared/constants'

export const querySchema = z.object({
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})

export const createHonorFamilySchema = z.object({
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
