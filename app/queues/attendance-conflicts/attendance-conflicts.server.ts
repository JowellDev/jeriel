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

			const today = new Date()
			const startOfDay = new Date(today.setHours(0, 0, 0, 0))
			const endOfDay = new Date(today.setHours(23, 59, 59, 999))

			for (const user of usersInBoth) {
				const attendances = await prisma.attendance.findMany({
					where: {
						memberId: user.id,
						date: {
							gte: startOfDay,
							lte: endOfDay,
						},
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

				const tribeAttendances = attendances.filter(
					a => a.report.entity === 'TRIBE' && a.report.tribeId === user.tribeId,
				)

				const deptAttendances = attendances.filter(
					a =>
						a.report.entity === 'DEPARTMENT' &&
						a.report.departmentId === user.departmentId,
				)

				if (tribeAttendances.length > 0 && deptAttendances.length > 0) {
					const tribeAttendance = tribeAttendances[0]
					const deptAttendance = deptAttendances[0]

					if (tribeAttendance.inChurch !== deptAttendance.inChurch) {
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

						console.log(`Conflit détecté pour l'utilisateur ${user.id}`)
					}
				}
			}
		} catch (error) {
			console.error('Erreur lors de la vérification des conflits:', error)
			throw error
		}
	},
)
