import { endOfMonth } from 'date-fns'
import { z } from 'zod'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'

export const archiveUserSchema = z.object({
	usersToArchive: z.string().transform(v => v.split(';')),
})

export const filterSchema = z.object({
	take: z.number().default(DEFAULT_QUERY_TAKE),
	page: z.number().default(1),
	entityType: z.enum(['ALL', 'TRIBE', 'DEPARTMENT', 'HONOR_FAMILY']).optional(),
	tribeId: z.string().optional(),
	departmentId: z.string().optional(),
	honorFamilyId: z.string().optional(),
	from: z.string().default('null'),
	to: z.string().default(endOfMonth(new Date()).toISOString()),
	query: z
		.string()
		.trim()
		.optional()
		.transform(v => v ?? ''),
})

export const resolveConflictSchema = z.object({
	memberId: z.string(),
	tribeAttendanceId: z.string(),
	departmentAttendanceId: z.string(),
	presences: z.string().optional(),
	date: z.string({ required_error: 'Veuillez choisir une date' }),
})

export type FilterOption = z.infer<typeof filterSchema>

export type MemberFilterOptions = z.infer<typeof filterSchema>
