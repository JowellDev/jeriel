import { startOfMonth, endOfMonth, startOfDay, subWeeks } from 'date-fns'
import type { AuthenticatedUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import { fetchAttendancesByMemberIds } from '~/helpers/attendance.server'
import { AT_RISK_SUNDAYS } from '../../constants'
import type { AlertCounts } from '../../types'
import { resolveScope } from '../scope.server'
import { getSundaysInRange } from './utils'

const PROFILE_NULL_FILTERS = [
	{ pictureUrl: null },
	{ phone: null },
	{ email: null },
	{ birthday: null },
	{ gender: null },
]

function lookbackSundays(reference: Date): Date[] {
	const from = subWeeks(reference, AT_RISK_SUNDAYS * 2 + 2)
	return getSundaysInRange(from, reference)
}

async function countAtRisk(
	memberIds: string[],
	reference: Date,
): Promise<number> {
	const sundays = lookbackSundays(reference)
	if (memberIds.length === 0 || sundays.length === 0) return 0

	const attendances = await fetchAttendancesByMemberIds(
		memberIds,
		sundays[0],
		reference,
	)
	const presentByMember = groupPresentSundays(attendances)
	const recorded = new Set(
		attendances.map(a => startOfDay(new Date(a.date)).getTime()),
	)
	const activeTimes = sundays
		.map(s => startOfDay(s).getTime())
		.filter(t => recorded.has(t))
		.slice(-AT_RISK_SUNDAYS)
	if (activeTimes.length < 2) return 0

	return memberIds.filter(id => {
		const present = presentByMember.get(id)
		return activeTimes.every(t => !present?.has(t))
	}).length
}

function groupPresentSundays(
	attendances: { memberId: string; date: Date; inChurch: boolean }[],
): Map<string, Set<number>> {
	const map = new Map<string, Set<number>>()
	for (const a of attendances) {
		if (!a.inChurch) continue
		const set = map.get(a.memberId) ?? new Set<number>()
		set.add(startOfDay(new Date(a.date)).getTime())
		map.set(a.memberId, set)
	}
	return map
}

/** Comptes synthétiques pour les widgets d'alerte du tableau de bord. */
export async function getAlertCounts(
	user: AuthenticatedUser,
): Promise<AlertCounts> {
	const now = new Date()
	const filter = {
		tab: 'overview' as const,
		from: startOfMonth(now).toISOString(),
		to: endOfMonth(now).toISOString(),
	}
	const { scope, memberWhere } = await resolveScope(user, filter)

	const [members, incompleteCount, lateReportsCount] = await Promise.all([
		prisma.user.findMany({ where: memberWhere, select: { id: true } }),
		prisma.user.count({ where: { ...memberWhere, OR: PROFILE_NULL_FILTERS } }),
		countLateReports(scope, now),
	])

	const atRiskCount = await countAtRisk(
		members.map(m => m.id),
		now,
	)

	return { atRiskCount, lateReportsCount, incompleteCount }
}

async function countLateReports(
	scope: Awaited<ReturnType<typeof resolveScope>>['scope'],
	reference: Date,
): Promise<number> {
	const dateFilter = {
		createdAt: { gte: startOfMonth(reference), lte: endOfMonth(reference) },
		submittedAt: null,
	}

	if (!scope.isAdmin && scope.selectedEntity) {
		const { type, id } = scope.selectedEntity
		return prisma.reportTracking.count({
			where: { ...dateFilter, [`${type}Id`]: id },
		})
	}

	return prisma.reportTracking.count({
		where: {
			...dateFilter,
			OR: [
				{ tribe: { churchId: scope.churchId ?? undefined } },
				{ department: { churchId: scope.churchId ?? undefined } },
				{ honorFamily: { churchId: scope.churchId ?? undefined } },
			],
		},
	})
}
