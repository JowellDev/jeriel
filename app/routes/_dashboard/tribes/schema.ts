import { z } from 'zod'
import { PHONE_NUMBER_REGEX, PWD_REGEX } from '~/shared/constants'

export const createTribeSchema = z
	.object({
		name: z.string({ required_error: 'Veuillez saisir le nom & prenoms' }),
		tribeManagerId: z.string({
			required_error: 'Veuillez sélectionner un responsable de la tribu',
		}),
		password: z
			.string({ required_error: 'Veuillez définir un mot de passe' })
			.min(8, 'Le mot de passe doit contenir au moins 8 caractères')
			.regex(
				PWD_REGEX,
				'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spéciaux',
			),
		memberIds: z
			.string()
			.transform(ids => JSON.parse(ids) as string[])
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
	.refine(data => data.memberIds || data.membersFile, {
		message:
			'Veuillez sélectionner au moins un membre ou importer un fichier Excel',
		path: ['memberIds'],
	})

export const memberSchema = z.object({
	name: z.string(),
	phone: z.string().regex(PHONE_NUMBER_REGEX, {
		message: 'Numéro de numéro invalide',
	}),
	location: z.string(),
})

export const querySchema = z.object({
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})
