import { z } from 'zod'

export const resolveConflictSchema = z.object({
	memberId: z.string(),
	tribeAttendanceId: z.string(),
	departmentAttendanceId: z.string(),
	presences: z.string().optional(),
	date: z.string({ required_error: 'Veuillez choisir une date' }),
})
