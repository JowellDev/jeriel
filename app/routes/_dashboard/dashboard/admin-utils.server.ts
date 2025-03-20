import { endOfMonth, format, setMonth, startOfMonth } from 'date-fns'
import type { AttendanceAdminStats, EntityStats } from './types'
import { prisma } from '~/utils/db.server'
import { fr } from 'date-fns/locale'

export async function getEntityStatsForChurchAdmin(
	churchId: string,
): Promise<EntityStats> {
	const startOfCurrentMonth = startOfMonth(new Date())

	const [
		totalMembers,
		newMembers,
		departmentsData,
		tribesData,
		honorFamiliesData,
	] = await Promise.all([
		prisma.user.count({
			where: {
				churchId,
				isActive: true,
				NOT: {
					roles: { hasSome: ['SUPER_ADMIN', 'ADMIN'] },
				},
			},
		}),
		prisma.user.count({
			where: {
				churchId,
				isActive: true,
				NOT: {
					roles: { hasSome: ['SUPER_ADMIN', 'ADMIN'] },
				},
				createdAt: {
					gte: startOfCurrentMonth,
				},
			},
		}),
		prisma.department.findMany({
			where: { churchId },
			select: {
				id: true,
				name: true,
				members: {
					where: {
						isActive: true,
						NOT: {
							roles: { hasSome: ['SUPER_ADMIN', 'ADMIN'] },
						},
					},
					select: {
						id: true,
						createdAt: true,
					},
				},
			},
		}),
		prisma.tribe.findMany({
			where: { churchId },
			select: {
				id: true,
				name: true,
				members: {
					where: {
						isActive: true,
						NOT: {
							roles: { hasSome: ['SUPER_ADMIN', 'ADMIN'] },
						},
					},
					select: {
						id: true,
						createdAt: true,
					},
				},
			},
		}),
		prisma.honorFamily.findMany({
			where: { churchId },
			select: {
				id: true,
				name: true,
				members: {
					where: {
						isActive: true,
						NOT: {
							roles: { hasSome: ['SUPER_ADMIN', 'ADMIN'] },
						},
					},
					select: {
						id: true,
						createdAt: true,
					},
				},
			},
		}),
	])

	const calculateEntityStats = (members: { createdAt: Date }[]) => {
		const newMemberCount = members.filter(
			member => member.createdAt >= startOfCurrentMonth,
		).length
		return {
			totalMembers: members.length,
			newMembers: newMemberCount,
			oldMembers: members.length - newMemberCount,
		}
	}

	const departments = departmentsData.map(dept => ({
		id: dept.id,
		name: dept.name,
		...calculateEntityStats(dept.members),
	}))

	const tribes = tribesData.map(tribe => ({
		id: tribe.id,
		name: tribe.name,
		...calculateEntityStats(tribe.members),
	}))

	const honorFamilies = honorFamiliesData.map(family => ({
		id: family.id,
		name: family.name,
		...calculateEntityStats(family.members),
	}))

	return {
		totalMembers,
		newMembers,
		oldMembers: totalMembers - newMembers,
		departments,
		tribes,
		honorFamilies,
	}
}

export async function getAttendanceStats(
	churchId: string,
): Promise<AttendanceAdminStats[]> {
	const currentYear = new Date().getFullYear()

	const monthsOfYear = Array.from({ length: 12 }).map((_, index) => {
		const date = setMonth(new Date(currentYear, 0), index)
		return {
			start: startOfMonth(date),
			end: endOfMonth(date),
			month: format(date, 'MMMM', { locale: fr }),
		}
	})

	const attendanceStats = await Promise.all(
		monthsOfYear.map(async ({ start, end, month }) => {
			const attendances = await prisma.attendance.findMany({
				where: {
					date: {
						gte: start,
						lte: end,
					},
					member: {
						churchId,
					},
				},
				select: { inChurch: true },
			})

			const presences = attendances.filter(a => a.inChurch === true).length
			const absences = attendances.filter(a => a.inChurch === false).length

			return {
				month,
				presences,
				absences,
			}
		}),
	)

	return attendanceStats
}
