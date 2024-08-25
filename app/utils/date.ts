import {
	eachDayOfInterval,
	endOfMonth,
	format,
	isSunday,
	startOfMonth,
} from 'date-fns'

export function getcurrentMonthSundays() {
	const start = startOfMonth(new Date())
	const end = endOfMonth(start)
	const allDays = eachDayOfInterval({ start, end })

	return allDays.filter(day => isSunday(day))
}

export function formatDate(date: string | number | Date) {
	return format(date, 'MM/dd/yyyy')
}
