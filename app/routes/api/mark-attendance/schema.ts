import { z } from 'zod'

export const memberAttendanceSchema = z.object({
	name: z.string(),
	memberId: z.string(),
	churchAttendance: z.boolean().optional(),
	serviceAttendance: z.boolean().optional(),
})

export const attendanceMarkingSchema = z.object({
	date: z.string({ required_error: 'Veuillez choisir une date' }).optional(),
	comment: z.string().optional(),
	membersAttendance: z.array(memberAttendanceSchema),
})
