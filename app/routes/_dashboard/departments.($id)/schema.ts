import { z } from 'zod'
import {
	DEFAULT_QUERY_TAKE,
	PWD_ERROR_MESSAGE,
	PWD_REGEX,
} from '~/shared/constants'

const baseDepartmentSchema = z.object({
	name: z.string({ required_error: 'Le nom ne peut pas être vide' }).trim(),
	managerId: z.string({
		required_error: 'Veuillez sélectionner un responsable',
	}),
	password: z
		.string({ required_error: PWD_ERROR_MESSAGE.min })
		.min(8, PWD_ERROR_MESSAGE.min)
		.regex(PWD_REGEX, PWD_ERROR_MESSAGE.invalid)
		.optional(),
})

export const createDepartmentSchema = baseDepartmentSchema
	.extend({
		selectionMode: z.enum(['manual', 'file']),
		members: z.string().optional(),
		membersFile: z.instanceof(File).optional(),
	})
	.refine(
		data => {
			if (data.selectionMode === 'manual' && !data.members) {
				return false
			}
			if (data.selectionMode === 'file' && !data.membersFile) {
				return false
			}
			return true
		},
		{
			message: 'Veuillez ajouter des membres',
			path: ['members'],
		},
	)

export const updateDepartmentSchema = baseDepartmentSchema
	.extend({
		selectionMode: z.enum(['manual', 'file']),
		members: z.string().optional(),
		membersFile: z.instanceof(File).optional(),
	})
	.refine(
		data => {
			if (data.selectionMode === 'manual' && !data.members) {
				return false
			}
			if (data.selectionMode === 'file' && !data.membersFile) {
				return false
			}
			return true
		},
		{
			message: 'Veuillez ajouter des membres',
			path: ['members'],
		},
	)

export type CreateDepartmentFormData = z.infer<typeof createDepartmentSchema>
export type UpdateDepartmentFormData = z.infer<typeof updateDepartmentSchema>

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
