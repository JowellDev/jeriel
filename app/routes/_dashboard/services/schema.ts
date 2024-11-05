import { z } from 'zod'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'

export const filterSchema = z.object({
	take: z.number().default(DEFAULT_QUERY_TAKE),
	page: z.number().default(1),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})

export const createServiceSchema = z
	.object({
		entity: z.enum(['tribe', 'department']),
		from: z.string({ required_error: 'Veuillez définir une période' }),
		to: z.string({ required_error: 'Veuillez définir une période' }),
		departmentId: z.string().optional(),
		tribeId: z.string().optional(),
	})
	.superRefine(({ entity, departmentId, tribeId }, ctx) => {
		if (entity === 'department' && !departmentId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Veuillez selectionner un departement',
				path: ['departmentId'],
			})
			return
		}

		if (entity === 'tribe' && !tribeId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Veuillez selectionner une tribu',
				path: ['tribeId'],
			})
			return
		}
	})
