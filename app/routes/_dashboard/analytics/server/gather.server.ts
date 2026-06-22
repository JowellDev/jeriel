import { parseWithZod } from '@conform-to/zod'
import { parseISO, min as minDate, subWeeks } from 'date-fns'
import invariant from 'tiny-invariant'
import { requireUser, type AuthenticatedUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import {
	prepareDateRanges,
	fetchAttendancesByMemberIds,
} from '~/helpers/attendance.server'
import { AT_RISK_SUNDAYS } from '../constants'
import { analyticsFilterSchema, type AnalyticsFilter } from '../schema'
import type { AnalyticsScope, ScopeEntity, ScopedMember } from '../types'
import { resolveScope } from './scope.server'
import { getSundaysInRange } from './metrics/utils'
import type { AttendanceRecord } from './metrics/attendance.server'

const MEMBER_SELECT = {
	id: true,
	name: true,
	email: true,
	phone: true,
	pictureUrl: true,
	gender: true,
	maritalStatus: true,
	birthday: true,
	createdAt: true,
	tribeId: true,
	departmentId: true,
	honorFamilyId: true,
} as const

export interface AnalyticsInputs {
	user: AuthenticatedUser
	scope: AnalyticsScope
	filter: AnalyticsFilter
	members: ScopedMember[]
	currentAttendances: AttendanceRecord[]
	previousAttendances: AttendanceRecord[]
	periodSundays: Date[]
	recentSundays: Date[]
	rankingEntities: ScopeEntity[]
	from: Date
	to: Date
	previousFrom: Date
	previousTo: Date
}

export function parseAnalyticsFilter(request: Request): AnalyticsFilter {
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: analyticsFilterSchema,
	})
	invariant(submission.status === 'success', 'Paramètres analytiques invalides')
	return submission.value
}

function getRecentSundays(reference: Date): Date[] {
	const from = subWeeks(reference, AT_RISK_SUNDAYS + 1)
	return getSundaysInRange(from, reference).slice(-AT_RISK_SUNDAYS)
}

async function fetchChurchEntities(
	churchId: string | null,
): Promise<ScopeEntity[]> {
	if (!churchId) return []
	const select = { id: true, name: true }
	const [tribes, departments, families] = await Promise.all([
		prisma.tribe.findMany({ where: { churchId }, select }),
		prisma.department.findMany({ where: { churchId }, select }),
		prisma.honorFamily.findMany({ where: { churchId }, select }),
	])

	return [
		...tribes.map(e => ({ ...e, type: 'tribe' as const })),
		...departments.map(e => ({ ...e, type: 'department' as const })),
		...families.map(e => ({ ...e, type: 'honorFamily' as const })),
	]
}

/** Collecte unique des données partagées par le loader et l'export. */
export async function gatherAnalyticsInputs(
	request: Request,
): Promise<AnalyticsInputs> {
	const user = await requireUser(request)
	const filter = parseAnalyticsFilter(request)
	const { scope, memberWhere } = await resolveScope(user, filter)

	const members = (await prisma.user.findMany({
		where: memberWhere,
		select: MEMBER_SELECT,
		orderBy: { name: 'asc' },
	})) as ScopedMember[]

	const from = parseISO(filter.from)
	const to = parseISO(filter.to)
	const { previousFrom, previousTo } = prepareDateRanges(to)
	const periodSundays = getSundaysInRange(from, to)
	const recentSundays = getRecentSundays(to)
	const windowStart = minDate([from, recentSundays[0] ?? from])
	const memberIds = members.map(m => m.id)

	const [currentAttendances, previousAttendances, rankingEntities] =
		await Promise.all([
			fetchAttendancesByMemberIds(memberIds, windowStart, to),
			fetchAttendancesByMemberIds(memberIds, previousFrom, previousTo),
			scope.isAdmin ? fetchChurchEntities(scope.churchId) : [],
		])

	return {
		user,
		scope,
		filter,
		members,
		currentAttendances,
		previousAttendances,
		periodSundays,
		recentSundays,
		rankingEntities,
		from,
		to,
		previousFrom,
		previousTo,
	}
}
