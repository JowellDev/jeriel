import {
	format,
	isWithinInterval,
	subMonths,
	addDays,
	setYear,
	differenceInYears,
	startOfMonth,
	endOfMonth,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { MaritalStatusValue } from '~/shared/constants'
import { AGE_BUCKETS, TOP_LIST_LIMIT } from '../../constants'
import type {
	BirthdayMember,
	MonthlyGrowthItem,
	OverviewMetrics,
	ScopedMember,
} from '../../types'
import { ageFromBirthday, buildDistribution } from './utils'

const GENDER_LABELS = { M: 'Hommes', F: 'Femmes' } as const

function countCreatedBetween(
	members: ScopedMember[],
	from: Date,
	to: Date,
): number {
	return members.filter(m =>
		isWithinInterval(new Date(m.createdAt), { start: from, end: to }),
	).length
}

function buildAgeDistribution(members: ScopedMember[], reference: Date) {
	return AGE_BUCKETS.map(bucket => ({
		label: bucket.label,
		value: members.filter(m => {
			const age = ageFromBirthday(m.birthday, reference)
			return age != null && age >= bucket.min && age <= bucket.max
		}).length,
	})).filter(item => item.value > 0)
}

function buildMonthlyGrowth(
	members: ScopedMember[],
	to: Date,
): MonthlyGrowthItem[] {
	return Array.from({ length: 6 }, (_, i) => {
		const monthDate = subMonths(to, 5 - i)
		const count = countCreatedBetween(
			members,
			startOfMonth(monthDate),
			endOfMonth(monthDate),
		)
		return { month: format(monthDate, 'MMM', { locale: fr }), count }
	})
}

/** KPIs démographiques et de croissance pour le périmètre courant. */
export function buildOverviewMetrics(
	members: ScopedMember[],
	from: Date,
	to: Date,
	previousFrom: Date,
	previousTo: Date,
): OverviewMetrics {
	const newMembers = countCreatedBetween(members, from, to)
	const previousNew = countCreatedBetween(members, previousFrom, previousTo)

	return {
		totalMembers: members.length,
		newMembers,
		oldMembers: members.length - newMembers,
		growthDelta: newMembers - previousNew,
		genderDistribution: buildDistribution(
			members.map(m => m.gender),
			GENDER_LABELS,
		),
		ageDistribution: buildAgeDistribution(members, to),
		maritalDistribution: buildDistribution(
			members.map(m => m.maritalStatus),
			MaritalStatusValue,
		),
		monthlyGrowth: buildMonthlyGrowth(members, to),
	}
}

function nextBirthdayDate(birthday: Date, reference: Date): Date {
	const candidate = setYear(new Date(birthday), reference.getFullYear())
	return candidate < reference
		? setYear(candidate, reference.getFullYear() + 1)
		: candidate
}

function toBirthdayMember(
	member: ScopedMember,
	reference: Date,
): BirthdayMember | null {
	if (!member.birthday) return null
	const next = nextBirthdayDate(member.birthday, reference)
	if (next > addDays(reference, 30)) return null

	return {
		id: member.id,
		name: member.name,
		phone: member.phone,
		day: format(next, 'EEEE dd MMM', { locale: fr }),
		turning: differenceInYears(next, new Date(member.birthday)) || null,
	}
}

/** Membres dont l'anniversaire tombe dans les 30 prochains jours (triés). */
export function buildUpcomingBirthdays(
	members: ScopedMember[],
	reference: Date,
): BirthdayMember[] {
	return members
		.filter(m => m.birthday)
		.map(m => ({
			member: m,
			next: nextBirthdayDate(m.birthday as Date, reference),
		}))
		.sort((a, b) => a.next.getTime() - b.next.getTime())
		.map(({ member }) => toBirthdayMember(member, reference))
		.filter((m): m is BirthdayMember => m !== null)
		.slice(0, TOP_LIST_LIMIT)
}
