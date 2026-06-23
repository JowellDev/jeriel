import { PROFILE_FIELDS, TOP_LIST_LIMIT, type ProfileFieldKey } from '../../constants'
import type {
	DataQualityMetrics,
	IncompleteMember,
	ScopedMember,
} from '../../types'
import { percentage } from './utils'

function isFieldMissing(member: ScopedMember, key: ProfileFieldKey): boolean {
	const value = member[key]
	return value === null || value === undefined || value === ''
}

function missingFields(member: ScopedMember): string[] {
	return PROFILE_FIELDS.filter(f => isFieldMissing(member, f.key)).map(
		f => f.label,
	)
}

function isUnassigned(member: ScopedMember): boolean {
	return !member.tribeId && !member.departmentId && !member.honorFamilyId
}

function buildMissingBreakdown(members: ScopedMember[]) {
	return PROFILE_FIELDS.map(f => ({
		label: f.label,
		value: members.filter(m => isFieldMissing(m, f.key)).length,
	})).filter(item => item.value > 0)
}

export function buildIncompleteList(members: ScopedMember[]): IncompleteMember[] {
	return members
		.map(m => ({ id: m.id, name: m.name, missing: missingFields(m) }))
		.filter(m => m.missing.length > 0)
		.sort((a, b) => b.missing.length - a.missing.length)
}

/** Complétude des fiches et membres non affectés à une entité. */
export function buildDataQualityMetrics(
	members: ScopedMember[],
	includeUnassigned: boolean,
): DataQualityMetrics {
	const incompleteMembers = buildIncompleteList(members)
	const unassigned = includeUnassigned ? members.filter(isUnassigned) : []
	const completeCount = members.length - incompleteMembers.length

	return {
		incompleteCount: incompleteMembers.length,
		unassignedCount: unassigned.length,
		completenessRate: percentage(completeCount, members.length),
		missingBreakdown: buildMissingBreakdown(members),
		incompleteMembers: incompleteMembers.slice(0, TOP_LIST_LIMIT),
		unassignedMembers: unassigned
			.slice(0, TOP_LIST_LIMIT)
			.map(m => ({ id: m.id, name: m.name })),
	}
}
