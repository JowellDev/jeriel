import { type AttendanceReportEntity } from '@prisma/client'
import { z } from 'zod'

const entityErrors: Record<
	AttendanceReportEntity,
	{ key: string; message: string }
> = {
	DEPARTMENT: {
		key: 'departmentId',
		message: 'Veuillez choisir un département',
	},
	TRIBE: {
		key: 'tribeId',
		message: 'Veuillez choisir une tribu',
	},
	HONOR_FAMILY: {
		key: 'honorFamilyId',
		message: "Veuillez choisir une famille d'honneur",
	},
}

export const memberAttendanceSchema = z.object({
	name: z.string(),
	memberId: z.string(),
	churchAttendance: z.boolean().optional(),
	serviceAttendance: z.boolean().optional(),
})

export const attendanceMarkingSchema = z
	.object({
		comment: z.string().optional(),
		tribeId: z.string().optional(),
		departmentId: z.string().optional(),
		honorFamilyId: z.string().optional(),
		attendances: z.string().optional(),
		date: z.string({ required_error: 'Veuillez choisir une date' }),
		entity: z.enum(['DEPARTMENT', 'TRIBE', 'HONOR_FAMILY'], {
			required_error: 'Veuillez choisir un entity',
		}),
	})
	.superRefine(({ entity, ...data }, ctx) => {
		const error = entityErrors[entity]

		if (!data[error.key as keyof typeof data]) {
			ctx.addIssue({
				path: [error.key],
				message: error.message,
				code: z.ZodIssueCode.custom,
			})
		}
	})
