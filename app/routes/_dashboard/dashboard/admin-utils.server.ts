import { format, setMonth, startOfMonth, endOfMonth } from 'date-fns'
import type { AttendanceAdminStats, EntityStats } from './types'
import { prisma } from '~/infrastructures/database/prisma.server'
import { fr } from 'date-fns/locale'
import { Role } from '@prisma/client'

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN]

function calculateEntityStats(
	members: { createdAt: Date }[],
	startOfCurrentMonth: Date,
) {
	const newMemberCount = members.filter(
		m => m.createdAt >= startOfCurrentMonth,
	).length

	return {
		totalMembers: members.length,
		newMembers: newMemberCount,
		oldMembers: members.length - newMemberCount,
	}
}

async function fetchChurchMemberCounts(
	churchId: string,
	startOfCurrentMonth: Date,
) {
	const baseWhere = {
		churchId,
		isActive: true,
		NOT: { roles: { hasSome: ADMIN_ROLES } },
	}

	const [totalMembers, newMembers] = await Promise.all([
		prisma.user.count({ where: baseWhere }),
		prisma.user.count({
			where: { ...baseWhere, createdAt: { gte: startOfCurrentMonth } },
		}),
	])

	return { totalMembers, newMembers }
}

async function fetchChurchEntitiesData(churchId: string) {
	const memberSelect = {
		where: { isActive: true, NOT: { roles: { hasSome: ADMIN_ROLES } } },
		select: { id: true, createdAt: true },
	}

	return Promise.all([
		prisma.department.findMany({
			where: { churchId },
			select: { id: true, name: true, members: memberSelect },
		}),
		prisma.tribe.findMany({
			where: { churchId },
			select: { id: true, name: true, members: memberSelect },
		}),
		prisma.honorFamily.findMany({
			where: { churchId },
			select: { id: true, name: true, members: memberSelect },
		}),
	])
}

function mapEntityStats(
	entities: { id: string; name: string; members: { createdAt: Date }[] }[],
	startOfCurrentMonth: Date,
) {
	return entities.map(e => ({
		id: e.id,
		name: e.name,
		...calculateEntityStats(e.members, startOfCurrentMonth),
	}))
}

export async function getEntityStatsForChurchAdmin(
	churchId: string,
): Promise<EntityStats> {
	const startOfCurrentMonth = startOfMonth(new Date())

	const { totalMembers, newMembers } = await fetchChurchMemberCounts(
		churchId,
		startOfCurrentMonth,
	)

	const [departmentsData, tribesData, honorFamiliesData] =
		await fetchChurchEntitiesData(churchId)

	return {
		totalMembers,
		newMembers,
		oldMembers: totalMembers - newMembers,
		departments: mapEntityStats(departmentsData, startOfCurrentMonth),
		tribes: mapEntityStats(tribesData, startOfCurrentMonth),
		honorFamilies: mapEntityStats(honorFamiliesData, startOfCurrentMonth),
	}
}

type MonthlyRow = {
	month_num: number
	presences: bigint
	absences: bigint
}

function buildYearMonthsMap(year: number): Map<number, string> {
	return new Map(
		Array.from({ length: 12 }, (_, i) => [
			i + 1,
			format(setMonth(new Date(year, 0), i), 'MMMM', { locale: fr }),
		]),
	)
}

export async function getAttendanceStats(
	churchId: string,
	date: Date = new Date(),
): Promise<AttendanceAdminStats[]> {
	const year = date.getFullYear()
	const yearStart = startOfMonth(new Date(year, 0))
	const yearEnd = endOfMonth(new Date(year, 11))

	const rows = await prisma.$queryRaw<MonthlyRow[]>`
		SELECT
			EXTRACT(MONTH FROM a.date)::int AS month_num,
			COUNT(*) FILTER (WHERE a."inChurch" = true)  AS presences,
			COUNT(*) FILTER (WHERE a."inChurch" = false) AS absences
		FROM attendances a
		JOIN users u ON a."memberId" = u.id
		WHERE u."churchId" = ${churchId}
		  AND a.date >= ${yearStart}
		  AND a.date <= ${yearEnd}
		GROUP BY EXTRACT(MONTH FROM a.date)
		ORDER BY month_num
	`

	const byMonth = new Map(rows.map(r => [r.month_num, r]))
	const monthNames = buildYearMonthsMap(year)

	return Array.from({ length: 12 }, (_, i) => {
		const num = i + 1
		const row = byMonth.get(num)
		return {
			month: monthNames.get(num)!,
			presences: row ? Number(row.presences) : 0,
			absences: row ? Number(row.absences) : 0,
		}
	})
}
