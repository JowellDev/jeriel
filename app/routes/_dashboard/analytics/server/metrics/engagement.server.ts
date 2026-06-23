import { differenceInMonths, startOfDay } from 'date-fns'
import {
	ENGAGEMENT_WEIGHTS,
	PROFILE_FIELDS,
	TENURE_MAX_MONTHS,
	TOP_LIST_LIMIT,
} from '../../constants'
import type {
	EngagementMember,
	EngagementMetrics,
	ScopedMember,
} from '../../types'
import type { AttendanceRecord } from './attendance.server'
import { percentage } from './utils'

const dayTime = (date: Date) => startOfDay(new Date(date)).getTime()

function presenceScore(
	memberId: string,
	presentByMember: Map<string, Set<number>>,
	sundayTimes: number[],
): number {
	if (sundayTimes.length === 0) return 0
	const present = presentByMember.get(memberId)
	const hits = sundayTimes.filter(t => present?.has(t)).length
	return percentage(hits, sundayTimes.length)
}

function tenureScore(member: ScopedMember, reference: Date): number {
	const start = member.createdAt
	const months = differenceInMonths(reference, new Date(start))
	return Math.min(Math.max(months, 0) / TENURE_MAX_MONTHS, 1) * 100
}

function profileScore(member: ScopedMember): number {
	const filled = PROFILE_FIELDS.filter(f => {
		const value = member[f.key]
		return value !== null && value !== undefined && value !== ''
	}).length
	return percentage(filled, PROFILE_FIELDS.length)
}

function scoreMember(
	member: ScopedMember,
	presentByMember: Map<string, Set<number>>,
	sundayTimes: number[],
	reference: Date,
): EngagementMember {
	const score =
		presenceScore(member.id, presentByMember, sundayTimes) *
			ENGAGEMENT_WEIGHTS.presence +
		tenureScore(member, reference) * ENGAGEMENT_WEIGHTS.tenure +
		profileScore(member) * ENGAGEMENT_WEIGHTS.profile

	return {
		id: member.id,
		name: member.name,
		pictureUrl: member.pictureUrl,
		score: Math.round(score),
	}
}

function buildPresentByMember(
	records: AttendanceRecord[],
): Map<string, Set<number>> {
	const map = new Map<string, Set<number>>()
	for (const r of records) {
		if (!r.inChurch) continue
		const set = map.get(r.memberId) ?? new Set<number>()
		set.add(dayTime(r.date))
		map.set(r.memberId, set)
	}
	return map
}

/** Score d'engagement 0–100 par membre (présence, ancienneté, complétude). */
export function buildEngagementMetrics(
	members: ScopedMember[],
	currentAttendances: AttendanceRecord[],
	periodSundays: Date[],
	reference: Date,
): EngagementMetrics {
	if (members.length === 0) {
		return { average: 0, topMembers: [], lowMembers: [] }
	}

	const presentByMember = buildPresentByMember(currentAttendances)
	const sundayTimes = periodSundays.map(dayTime)
	const scored = members
		.map(m => scoreMember(m, presentByMember, sundayTimes, reference))
		.sort((a, b) => b.score - a.score)

	const average = Math.round(
		scored.reduce((sum, m) => sum + m.score, 0) / scored.length,
	)

	return {
		average,
		topMembers: scored.slice(0, TOP_LIST_LIMIT),
		lowMembers: scored.slice(-TOP_LIST_LIMIT).reverse(),
	}
}
