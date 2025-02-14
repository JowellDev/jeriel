import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import type { AttendanceStats, EntityStats } from './types'
import { prisma } from '~/utils/db.server'
import { fr } from 'date-fns/locale'

export async function getEntityStatsForChurchAdmin(
	churchId: string,
): Promise<EntityStats> {
	const [totalMembers, newMembers, departments, tribes, honorFamilies] =
		await Promise.all([
			prisma.user.count({
				where: {
					churchId,
					isActive: true,
					NOT: { roles: { hasSome: ['SUPER_ADMIN', 'ADMIN'] } },
				},
			}),
			prisma.user.count({
				where: {
					churchId,
					isActive: true,
					NOT: { roles: { hasSome: ['SUPER_ADMIN', 'ADMIN'] } },
					createdAt: {
						gte: startOfMonth(new Date()),
					},
				},
			}),
			prisma.department.findMany({
				where: { churchId },
				select: {
					id: true,
					name: true,
					_count: {
						select: { members: true },
					},
				},
			}),
			prisma.tribe.findMany({
				where: { churchId },
				select: {
					id: true,
					name: true,
					_count: {
						select: { members: true },
					},
				},
			}),
			prisma.honorFamily.findMany({
				where: { churchId },
				select: {
					id: true,
					name: true,
					_count: {
						select: { members: true },
					},
				},
			}),
		])

	return {
		totalMembers,
		newMembers,
		oldMembers: totalMembers - newMembers,
		departments: departments.map(d => ({
			id: d.id,
			name: d.name,
			members: d._count.members,
		})),
		tribes: tribes.map(t => ({
			id: t.id,
			name: t.name,
			members: t._count.members,
		})),
		honorFamilies: honorFamilies.map(h => ({
			id: h.id,
			name: h.name,
			members: h._count.members,
		})),
	}
}

export async function getAttendanceStats(
	churchId: string,
): Promise<AttendanceStats[]> {
	const last12Months = Array.from({ length: 12 })
		.map((_, i) => {
			const date = subMonths(new Date(), i)
			return {
				start: startOfMonth(date),
				end: endOfMonth(date),
				month: format(date, 'MMMM', { locale: fr }),
			}
		})
		.reverse()

	const attendanceStats = await Promise.all(
		last12Months.map(async ({ start, end, month }) => {
			const [totalMembers, presentMembers] = await Promise.all([
				prisma.user.count({
					where: {
						churchId,
						isActive: true,
						createdAt: { lte: end },
					},
				}),
				prisma.attendance.count({
					where: {
						date: {
							gte: start,
							lte: end,
						},
						member: {
							churchId,
						},
						inChurch: true,
					},
				}),
			])

			return {
				month,
				présence: presentMembers,
				absence: totalMembers - presentMembers,
			}
		}),
	)

	return attendanceStats
}
