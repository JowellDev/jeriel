import { type ActionFunctionArgs } from '@remix-run/node'
import { attendanceEditSchema, type memberAttendanceSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import { type z } from 'zod'
import { prisma } from '~/infrastructures/database/prisma.server'
import { requireUser } from '~/utils/auth.server'
import { Role } from '@prisma/client'

type MemberAttendanceData = z.infer<typeof memberAttendanceSchema>
type AttendanceEditData = z.infer<typeof attendanceEditSchema>

export const action = async ({ request }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)

	// Check if user is a manager
	const isManager =
		currentUser.roles.includes(Role.TRIBE_MANAGER) ||
		currentUser.roles.includes(Role.DEPARTMENT_MANAGER) ||
		currentUser.roles.includes(Role.HONOR_FAMILY_MANAGER)

	if (!isManager) {
		return {
			success: false,
			message: "Vous n'avez pas les droits pour modifier ce rapport",
			submission: null,
		}
	}

	const formData = await request.formData()
	const submission = parseWithZod(formData, {
		schema: attendanceEditSchema,
	})

	if (submission.status !== 'success')
		return { submission: submission.reply(), success: false, message: null }

	try {
		await editAttendances(submission.value, currentUser.id)

		return {
			success: true,
			message: 'Rapport modifié avec succès !',
			submission: submission.reply(),
		}
	} catch (error) {
		return {
			success: false,
			message:
				error instanceof Error
					? error.message
					: 'Une erreur est survenue lors de la modification du rapport',
			submission: submission.reply(),
		}
	}
}

async function editAttendances(data: AttendanceEditData, submitterId: string) {
	const { attendances, reportId } = data
	const parsedAttendances = JSON.parse(
		attendances as string,
	) as MemberAttendanceData[]

	const date = new Date(data.date)

	// Check if the report exists and belongs to the current user
	const existingReport = await prisma.attendanceReport.findFirst({
		where: {
			id: reportId,
			submitterId,
		},
		include: {
			attendances: true,
		},
	})

	if (!existingReport) {
		throw new Error(
			"Le rapport n'existe pas ou vous n'avez pas les droits pour le modifier",
		)
	}

	// Update the report
	return prisma.attendanceReport.update({
		where: { id: reportId },
		data: {
			comment: data.comment,
			attendances: {
				deleteMany: {},
				createMany: {
					data: parsedAttendances.map(attendance => ({
						date: date,
						memberId: attendance.memberId,
						inChurch: attendance.churchAttendance ?? false,
						inService: attendance.serviceAttendance,
						inMeeting: attendance.meetingAttendance,
					})),
				},
			},
		},
	})
}

export type EditAttendanceActionType = typeof action
