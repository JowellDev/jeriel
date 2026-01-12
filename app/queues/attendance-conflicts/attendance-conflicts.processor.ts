import { type Job } from 'bullmq'
import { prisma } from '~/infrastructures/database/prisma.server'
import { notifyAdminForAttendanceConflicts } from '~/helpers/notification.server'
import { bullmqLogger } from '~/helpers/queue'

export interface AttendanceConflictsJobData {
	userId?: string
}

export async function processAttendanceConflicts(
	job: Job<AttendanceConflictsJobData>,
) {
	try {
		bullmqLogger.info(
			`Démarrage de la vérification des conflits - Job ${job.id}`,
		)

		const usersInBoth = await prisma.user.findMany({
			where: {
				AND: [{ tribeId: { not: null } }, { departmentId: { not: null } }],
			},
			select: {
				id: true,
				tribeId: true,
				departmentId: true,
			},
		})

		let conflictsFound = 0

		for (const user of usersInBoth) {
			const attendances = await prisma.attendance.findMany({
				where: {
					memberId: user.id,
				},
				include: {
					report: {
						select: {
							entity: true,
							tribeId: true,
							departmentId: true,
						},
					},
				},
			})

			const attendancesByDate = attendances.reduce(
				(acc, attendance) => {
					const date = new Date(attendance.date).toISOString().split('T')[0]
					if (!acc[date]) {
						acc[date] = []
					}
					acc[date].push(attendance)
					return acc
				},
				{} as Record<string, typeof attendances>,
			)

			for (const [date, dateAttendances] of Object.entries(attendancesByDate)) {
				const tribeAttendances = dateAttendances.filter(
					a => a.report.entity === 'TRIBE' && a.report.tribeId === user.tribeId,
				)

				const deptAttendances = dateAttendances.filter(
					a =>
						a.report.entity === 'DEPARTMENT' &&
						a.report.departmentId === user.departmentId,
				)

				if (tribeAttendances.length > 0 && deptAttendances.length > 0) {
					const tribeAttendance = tribeAttendances[0]
					const deptAttendance = deptAttendances[0]

					const hasConflict =
						tribeAttendance.inChurch !== deptAttendance.inChurch

					if (hasConflict) {
						await prisma.$transaction([
							prisma.attendance.update({
								where: { id: tribeAttendance.id },
								data: { hasConflict: true },
							}),
							prisma.attendance.update({
								where: { id: deptAttendance.id },
								data: { hasConflict: true },
							}),
						])

						await notifyAdminForAttendanceConflicts(
							user.id,
							date,
							user.tribeId!,
							user.departmentId!,
						)

						conflictsFound++
						bullmqLogger.info(
							`Conflit détecté pour l'utilisateur ${user.id} à la date ${date}`,
						)
					}
				}
			}
		}

		bullmqLogger.info(
			`Vérification des conflits terminée - ${conflictsFound} conflit(s) trouvé(s)`,
		)
	} catch (error) {
		bullmqLogger.error('Erreur lors de la vérification des conflits', {
			extra: { error },
		})
		throw error
	}
}
