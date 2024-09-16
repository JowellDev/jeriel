import {
	eachDayOfInterval,
	endOfMonth,
	format,
	isSunday,
	startOfMonth,
	set,
} from 'date-fns'

export function getMonthSundays(date: Date) {
	const start = startOfMonth(date)
	const end = endOfMonth(start)
	const allDays = eachDayOfInterval({ start, end })

	return allDays.filter(day => isSunday(day))
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
