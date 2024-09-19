import { z } from 'zod'
import { PWD_REGEX } from '~/shared/constants'

const baseDepartmentSchema = z.object({
	name: z.string().min(1, 'Le nom ne peut pas être vide'),
	managerId: z.string(),
})

export const createDepartmentSchema = baseDepartmentSchema
	.extend({
		password: z
			.string()
			.min(8)
			.regex(
				PWD_REGEX,
				'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial',
			),
		passwordConfirm: z.string(),
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
			return data.password === data.passwordConfirm
		},
		{
			message: 'Invalid form data',
			path: ['form'],
		},
	)

export const updateDepartmentSchema = baseDepartmentSchema
	.extend({
		password: z
			.string()
			.min(8)
			.regex(
				PWD_REGEX,
				'Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial',
			)
			.optional(),
		passwordConfirm: z.string().optional(),
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
			return !data.password || data.password === data.passwordConfirm
		},
		{
			message: 'Invalid form data',
			path: ['form'],
		},
	)

export type CreateDepartmentFormData = z.infer<typeof createDepartmentSchema>
export type UpdateDepartmentFormData = z.infer<typeof updateDepartmentSchema>

export const querySchema = z.object({
	take: z.number().default(10),
	page: z.number().default(1),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})

export type FilterOption = z.infer<typeof querySchema>
