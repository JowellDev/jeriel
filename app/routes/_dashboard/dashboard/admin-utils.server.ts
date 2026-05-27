import { endOfMonth, format, setMonth, startOfMonth } from 'date-fns'
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

function buildYearMonths(year: number) {
	return Array.from({ length: 12 }).map((_, index) => {
		const monthDate = setMonth(new Date(year, 0), index)
		return {
			start: startOfMonth(monthDate),
			end: endOfMonth(monthDate),
			month: format(monthDate, 'MMMM', { locale: fr }),
		}
	})
}

function countMonthAttendances(
	attendances: { inChurch: boolean; date: Date }[],
	start: Date,
	end: Date,
) {
	const monthAttendances = attendances.filter(
		a => a.date >= start && a.date <= end,
	)
	return {
		presences: monthAttendances.filter(a => a.inChurch === true).length,
		absences: monthAttendances.filter(a => a.inChurch === false).length,
	}
}

export async function getAttendanceStats(
	churchId: string,
	date: Date = new Date(),
): Promise<AttendanceAdminStats[]> {
	const currentYear = date.getFullYear()
	const attendances = await prisma.attendance.findMany({
		where: {
			date: {
				gte: startOfMonth(new Date(currentYear, 0)),
				lte: endOfMonth(new Date(currentYear, 11)),
			},
			member: { churchId },
		},
		select: { inChurch: true, date: true },
	})

	return buildYearMonths(currentYear).map(({ start, end, month }) => ({
		month,
		...countMonthAttendances(attendances, start, end),
	}))
}
