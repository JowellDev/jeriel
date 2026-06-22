import { startOfDay, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
	AT_RISK_SUNDAYS,
	HEATMAP_MEMBER_LIMIT,
	TOP_LIST_LIMIT,
} from '../../constants'
import type {
	AtRiskMember,
	AttendanceMetrics,
	EntityRanking,
	HeatmapRow,
	ScopeEntity,
	ScopedMember,
} from '../../types'
import { percentage } from './utils'

export interface AttendanceRecord {
	memberId: string
	date: Date
	inChurch: boolean
}

export interface AttendanceInput {
	members: ScopedMember[]
	currentAttendances: AttendanceRecord[]
	previousAttendances: AttendanceRecord[]
	periodSundays: Date[]
	/** Dimanches de la fenêtre de détection du risque (peut dépasser la période). */
	lookbackSundays: Date[]
	rankingEntities: ScopeEntity[]
}

const dayTime = (date: Date) => startOfDay(new Date(date)).getTime()

function countPresence(records: AttendanceRecord[], sundayTimes: Set<number>) {
	let present = 0
	let absent = 0
	for (const r of records) {
		if (!sundayTimes.has(dayTime(r.date))) continue
		if (r.inChurch) present++
		else absent++
	}
	return { present, absent }
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

function buildLastSeen(records: AttendanceRecord[]): Map<string, Date> {
	const map = new Map<string, Date>()
	for (const r of records) {
		if (!r.inChurch) continue
		const current = map.get(r.memberId)
		if (!current || new Date(r.date) > current)
			map.set(r.memberId, new Date(r.date))
	}
	return map
}

/**
 * Dimanches réellement « suivis » (au moins un relevé d'assiduité existe),
 * limités aux AT_RISK_SUNDAYS plus récents. Évite de flaguer tout le monde
 * quand aucun rapport n'a encore été soumis pour un dimanche.
 */
function collectActiveSundayTimes(
	records: AttendanceRecord[],
	lookbackSundays: Date[],
): number[] {
	const recorded = new Set(records.map(r => dayTime(r.date)))
	return lookbackSundays
		.map(dayTime)
		.filter(t => recorded.has(t))
		.slice(-AT_RISK_SUNDAYS)
}

export function buildAtRiskMembers(input: AttendanceInput): AtRiskMember[] {
	const presentByMember = buildPresentByMember(input.currentAttendances)
	const lastSeen = buildLastSeen(input.currentAttendances)
	const activeTimes = collectActiveSundayTimes(
		input.currentAttendances,
		input.lookbackSundays,
	)
	if (activeTimes.length < 2) return []

	return input.members
		.map(m => toAtRiskMember(m, presentByMember.get(m.id), activeTimes, lastSeen))
		.filter((m): m is AtRiskMember => m !== null)
		.sort((a, b) => b.missedCount - a.missedCount)
}

function toAtRiskMember(
	member: ScopedMember,
	presentSet: Set<number> | undefined,
	activeTimes: number[],
	lastSeen: Map<string, Date>,
): AtRiskMember | null {
	// Membre « à risque » = il fréquentait (au moins une présence récente)
	// mais a manqué TOUS les derniers dimanches suivis. Les membres jamais
	// relevés sont « non suivis », pas « à risque » (cf. qualité des données).
	const seen = lastSeen.get(member.id)
	if (!presentSet || presentSet.size === 0 || !seen) return null

	const missedCount = activeTimes.filter(t => !presentSet.has(t)).length
	if (missedCount < activeTimes.length) return null

	return {
		id: member.id,
		name: member.name,
		phone: member.phone,
		missedCount,
		lastSeen: format(seen, 'dd MMM yyyy', { locale: fr }),
	}
}

function buildHeatmap(
	members: ScopedMember[],
	currentAttendances: AttendanceRecord[],
	periodSundays: Date[],
	atRisk: AtRiskMember[],
): HeatmapRow[] {
	const presentByMember = buildPresentByMember(currentAttendances)
	const absentTimes = buildAbsentByMember(currentAttendances)
	const riskRank = new Map(atRisk.map((m, i) => [m.id, i]))
	const ordered = [...members].sort(
		(a, b) => (riskRank.get(a.id) ?? 999) - (riskRank.get(b.id) ?? 999),
	)

	return ordered.slice(0, HEATMAP_MEMBER_LIMIT).map(m => ({
		id: m.id,
		name: m.name,
		cells: periodSundays.map(s =>
			cellState(dayTime(s), presentByMember.get(m.id), absentTimes.get(m.id)),
		),
	}))
}

function buildAbsentByMember(
	records: AttendanceRecord[],
): Map<string, Set<number>> {
	const map = new Map<string, Set<number>>()
	for (const r of records) {
		if (r.inChurch) continue
		const set = map.get(r.memberId) ?? new Set<number>()
		set.add(dayTime(r.date))
		map.set(r.memberId, set)
	}
	return map
}

function cellState(
	time: number,
	present: Set<number> | undefined,
	absent: Set<number> | undefined,
): boolean | null {
	if (present?.has(time)) return true
	if (absent?.has(time)) return false
	return null
}

function buildRanking(input: AttendanceInput): EntityRanking[] {
	const periodTimes = new Set(input.periodSundays.map(dayTime))

	return input.rankingEntities
		.map(entity =>
			rankEntity(entity, input.members, input.currentAttendances, periodTimes),
		)
		.filter((r): r is EntityRanking => r !== null)
		.sort((a, b) => b.rate - a.rate)
}

function rankEntity(
	entity: ScopeEntity,
	members: ScopedMember[],
	records: AttendanceRecord[],
	periodTimes: Set<number>,
): EntityRanking | null {
	const memberIds = new Set(
		members.filter(m => m[`${entity.type}Id`] === entity.id).map(m => m.id),
	)
	if (memberIds.size === 0) return null

	const entityRecords = records.filter(r => memberIds.has(r.memberId))
	const { present, absent } = countPresence(entityRecords, periodTimes)
	return {
		id: entity.id,
		type: entity.type,
		name: entity.name,
		memberCount: memberIds.size,
		rate: percentage(present, present + absent),
	}
}

/** Taux de présence, tendance, membres à risque, heatmap et classement. */
export function buildAttendanceMetrics(
	input: AttendanceInput,
): AttendanceMetrics {
	const periodTimes = new Set(input.periodSundays.map(dayTime))
	const current = countPresence(input.currentAttendances, periodTimes)
	const previousTimes = new Set(
		input.previousAttendances.map(r => dayTime(r.date)),
	)
	const previous = countPresence(input.previousAttendances, previousTimes)

	const attendanceRate = percentage(
		current.present,
		current.present + current.absent,
	)
	const previousRate = percentage(
		previous.present,
		previous.present + previous.absent,
	)
	const atRiskMembers = buildAtRiskMembers(input)

	return {
		attendanceRate,
		rateDelta:
			previous.present + previous.absent > 0
				? attendanceRate - previousRate
				: null,
		presentCount: current.present,
		absentCount: current.absent,
		atRiskCount: atRiskMembers.length,
		atRiskMembers: atRiskMembers.slice(0, TOP_LIST_LIMIT),
		sundays: input.periodSundays.map(s => format(s, 'dd/MM')),
		heatmap: buildHeatmap(
			input.members,
			input.currentAttendances,
			input.periodSundays,
			atRiskMembers,
		),
		ranking: buildRanking(input),
	}
}
