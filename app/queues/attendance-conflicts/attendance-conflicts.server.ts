import { Queue } from 'quirrel/remix'
import { prisma } from '~/utils/db.server'

export const attendancesConflictsQueue = Queue(
	'queues/attendance-conflicts',
	async () => {
		try {
			console.log('Démarrage de la vérification des conflits')

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

				for (const [date, dateAttendances] of Object.entries(
					attendancesByDate,
				)) {
					const tribeAttendances = dateAttendances.filter(
						a =>
							a.report.entity === 'TRIBE' && a.report.tribeId === user.tribeId,
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

							console.log(
								`Conflit détecté pour l'utilisateur ${user.id} à la date ${date}`,
							)
						}
					}
				}
			}
		} catch (error) {
			console.error('Erreur lors de la vérification des conflits:', error)
			throw error
		}
	},
)
