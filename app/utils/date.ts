import {
	eachDayOfInterval,
	endOfMonth,
	format,
	isSunday,
	startOfMonth,
	set,
	isSameDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'

export function getMonthSundays(date: Date) {
	const start = startOfMonth(date)
	const end = endOfMonth(start)
	const allDays = eachDayOfInterval({ start, end })

	return allDays.filter(day => isSunday(day))
}

export function getSundayIndex(currentDay: Date, sundays: Date[]): number {
	const index = sundays.findIndex(sunday => isSameDay(sunday, currentDay))
	return index + 1
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
	return date ? format(new Date(date), pattern, { locale: locale }) : ''
}

export function getCurrentOrPreviousSunday(): Date {
	const today = new Date()
	const currentDay = today.getDay()

	if (currentDay === 0) {
		return today
	}

	const daysToSubtract = currentDay
	const previousSunday = new Date(today)
	previousSunday.setDate(today.getDate() - daysToSubtract)

	previousSunday.setHours(0, 0, 0, 0)

	return previousSunday
}

export function isDateInServicePeriod(
	date: Date,
	service: { from: Date | string; to: Date | string },
): boolean {
	return date >= new Date(service.from) && date <= new Date(service.to)
}

export function hasActiveServiceForDate(
	date: Date,
	services: Array<{ from: Date | string; to: Date | string }>,
) {
	return !!services.find(
		service => date >= new Date(service.from) && date <= new Date(service.to),
	)
}
