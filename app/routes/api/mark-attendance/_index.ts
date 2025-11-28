import { type ActionFunctionArgs } from '@remix-run/node'
import { attendanceMarkingSchema, type memberAttendanceSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import { type z } from 'zod'
import { prisma } from '~/infrastructures/database/prisma.server'
import { requireUser } from '~/utils/auth.server'
import { fr } from 'date-fns/locale'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { type AttendanceReportEntity } from '@prisma/client'
import { notifyAdminForReport } from '~/helpers/notification.server'

type MemberAttendanceData = z.infer<typeof memberAttendanceSchema>
type AttendanceMarkingData = z.infer<typeof attendanceMarkingSchema>

export const action = async ({ request }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: attendanceMarkingSchema,
	})

	if (submission.status !== 'success')
		return { submission: submission.reply(), success: false, message: null }

	try {
		const report = await markAttendances(submission.value, currentUser.id)

		await notifyAdminForReport(
			report.id,
			submission.value.entity,
			currentUser.id,
		)

		return {
			success: true,
			message: 'Marquage des présences effectué !',
			submission: submission.reply(),
		}
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: 'Une erreur est survenue lors du marquage des absences',
			submission: submission.reply(),
		}
	}
}

async function checkExistingMeetingAttendance(
	entity: AttendanceReportEntity,
	entityId: { departmentId?: string; tribeId?: string; honorFamilyId?: string },
	date: Date,
) {
	const weekStart = startOfWeek(date)
	const weekEnd = endOfWeek(date)

	const existingMeetingAttendance = await prisma.attendanceReport.findFirst({
		where: {
			entity,
			...(entity === 'DEPARTMENT' && { departmentId: entityId.departmentId }),
			...(entity === 'TRIBE' && { tribeId: entityId.tribeId }),
			...(entity === 'HONOR_FAMILY' && {
				honorFamilyId: entityId.honorFamilyId,
			}),
			attendances: {
				some: {
					date: {
						gte: weekStart,
						lte: weekEnd,
					},
					inMeeting: true,
				},
			},
		},
	})

	return existingMeetingAttendance
}

async function markAttendances(
	data: AttendanceMarkingData,
	submitterId: string,
) {
	const { attendances } = data
	const parsedAttendances = JSON.parse(
		attendances as string,
	) as MemberAttendanceData[]

	const date = new Date(data.date)

	const existingReport = await prisma.attendanceReport.findFirst({
		where: {
			entity: data.entity,
			...(data.entity === 'DEPARTMENT' && { departmentId: data.departmentId }),
			...(data.entity === 'TRIBE' && { tribeId: data.tribeId }),
			...(data.entity === 'HONOR_FAMILY' && {
				honorFamilyId: data.honorFamilyId,
			}),
			attendances: {
				some: {
					date: date,
				},
			},
		},
	})

	if (existingReport) {
		throw new Error(
			`Le marquage de présence du ${format(date, 'PPPP', { locale: fr })} a déjà été soumis !`,
		)
	}

	const hasMeetingAttendance = parsedAttendances.some(a => a.meetingAttendance)
	if (hasMeetingAttendance) {
		const existingMeetingAttendance = await checkExistingMeetingAttendance(
			data.entity,
			{
				departmentId: data.departmentId,
				tribeId: data.tribeId,
				honorFamilyId: data.honorFamilyId,
			},
			date,
		)

		if (existingMeetingAttendance) {
			const weekStart = format(startOfWeek(date), 'PPPP', { locale: fr })
			const weekEnd = format(endOfWeek(date), 'PPPP', { locale: fr })
			throw new Error(
				`Une présence de réunion a déjà été marquée pour la semaine du ${weekStart} au ${weekEnd} !`,
			)
		}
	}

	return prisma.attendanceReport.create({
		data: {
			submitterId,
			entity: data.entity,
			comment: data.comment,
			...(data.entity === 'DEPARTMENT' && { departmentId: data.departmentId }),
			...(data.entity === 'TRIBE' && { tribeId: data.tribeId }),
			...(data.entity === 'HONOR_FAMILY' && {
				honorFamilyId: data.honorFamilyId,
			}),
			attendances: {
				createMany: {
					data: parsedAttendances.map(attendance => ({
						date: date,
						memberId: attendance.memberId,
						inChurch: attendance.churchAttendance,
						inService: attendance.serviceAttendance,
						inMeeting: attendance.meetingAttendance,
					})),
				},
			},
		},
	})
}

export type MarkAttendanceActionType = typeof action
