import {
	eachDayOfInterval,
	endOfMonth,
	format,
	isSunday,
	startOfMonth,
	set,
	isSameDay,
	isWednesday,
	isFriday,
	eachWeekOfInterval,
	endOfWeek,
	isToday,
	isYesterday,
} from 'date-fns'
import { fr } from 'date-fns/locale'

export function getMonthSundays(date: Date) {
	const start = startOfMonth(date)
	const end = endOfMonth(start)
	const allDays = eachDayOfInterval({ start, end })

	return allDays.filter(day => isSunday(day))
}

export function getMonthMeetingDays(date: Date) {
	const start = startOfMonth(date)
	const end = endOfMonth(start)
	const allDays = eachDayOfInterval({ start, end })

	return allDays.filter(day => isWednesday(day))
}

export function getMonthWeeks(date: Date) {
	const start = startOfMonth(date)
	const end = endOfMonth(date)

	return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map(
		weekStart => ({
			startDate: weekStart,
			endDate: endOfWeek(weekStart),
		}),
	)
}

export function formatDate(
	date: string | number | Date,
	pattern = 'dd/MM/yyyy',
) {
	return format(new Date(date), pattern)
}

export function normalizeDate(date: Date, to: 'start' | 'end' = 'start') {
	return set(date, {
		hours: to === 'start' ? 0 : 23,
		minutes: to === 'start' ? 0 : 59,
		seconds: to === 'start' ? 0 : 59,
		milliseconds: to === 'start' ? 0 : 999,
	})
}

export function formatIntegrationDate(
	date?: string | number | Date | null,
	pattern = 'dd MMMM yyyy',
	locale = fr,
) {
	return date ? format(new Date(date), pattern, { locale: locale }) : 'N/A'
}

export function hasActiveServiceForDate(
	date: Date,
	services: Array<{ from: Date | string; to: Date | string }>,
) {
	for (const service of services) {
		const fromDate = new Date(service.from)
		const toDate = new Date(service.to)

		const daysOfServices = eachDayOfInterval({
			start: fromDate,
			end: toDate,
		}).filter(day => isSunday(day) || isWednesday(day) || isFriday(day))

		const hasMatchingDay = daysOfServices.find(day => isSameDay(date, day))

		if (hasMatchingDay !== undefined) {
			return true
		}
	}

	return false
}

export function formatDateWithRelativeTime(date: Date) {
	if (isToday(date)) {
		return `Aujourd'hui à ${format(date, 'HH:mm', { locale: fr })}`
	} else if (isYesterday(date)) {
		return `Hier à ${format(date, 'HH:mm', { locale: fr })}`
	} else {
		return format(date, 'EEEE, d MMMM yyyy, HH:mm', { locale: fr })
	}
}
