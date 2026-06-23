import { eachDayOfInterval, isSunday, differenceInYears } from 'date-fns'
import type { DistributionItem } from '../../types'

export function percentage(count: number, total: number): number {
	return total > 0 ? Math.round((count / total) * 100) : 0
}

/** Tous les dimanches (00:00) inclus dans l'intervalle [from, to]. */
export function getSundaysInRange(from: Date, to: Date): Date[] {
	if (from > to) return []
	return eachDayOfInterval({ start: from, end: to }).filter(isSunday)
}

export function ageFromBirthday(
	birthday: Date | null,
	reference: Date = new Date(),
): number | null {
	return birthday ? differenceInYears(reference, new Date(birthday)) : null
}

/** Agrège une liste de clés en items de distribution ordonnés par libellé fourni. */
export function buildDistribution<T extends string>(
	values: (T | null)[],
	labels: Record<T, string>,
): DistributionItem[] {
	const counts = new Map<T, number>()
	for (const value of values) {
		if (value == null) continue
		counts.set(value, (counts.get(value) ?? 0) + 1)
	}

	return (Object.keys(labels) as T[])
		.map(key => ({ label: labels[key], value: counts.get(key) ?? 0 }))
		.filter(item => item.value > 0)
}
