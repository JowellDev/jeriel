import { json, type ActionFunctionArgs } from '@remix-run/node'
import { attendanceMarkingSchema, type memberAttendanceSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import { type z } from 'zod'
import { prisma } from '~/utils/db.server'
import { requireUser } from '~/utils/auth.server'
import { fr } from 'date-fns/locale'
import { format } from 'date-fns'

type MemberAttendanceData = z.infer<typeof memberAttendanceSchema>
type AttendanceMarkingData = z.infer<typeof attendanceMarkingSchema>

export const action = async ({ request }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: attendanceMarkingSchema,
	})

	if (submission.status !== 'success')
		return json(
			{ submission: submission.reply(), success: false, message: null },
			{ status: 400 },
		)

	try {
		await markAttendances(submission.value, currentUser.id)

		return json({
			success: true,
			message: 'Marquage des présences effectué !',
			submission: submission.reply(),
		})
	} catch (error) {
		return json({
			success: false,
			message:
				error instanceof Error
					? error.message
					: 'Une erreur est survenue lors du marquage des absences',
			submission: submission.reply(),
		})
	}
}

async function markAttendances(
	data: AttendanceMarkingData,
	submitterId: string,
) {
	const { attendances } = data
	const parsedAttendances = JSON.parse(
		attendances as string,
	) as MemberAttendanceData[]

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
					date: new Date(data.date),
				},
			},
		},
	})

	if (existingReport) {
		throw new Error(
			`Le marquage de présence du ${format(data.date, 'PPPP', { locale: fr })} a déjà été soumis !`,
		)
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
						date: new Date(data.date),
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
