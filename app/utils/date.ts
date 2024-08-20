import { eachDayOfInterval, endOfMonth, isSunday, startOfMonth } from 'date-fns'

export function getcurrentMonthSundays() {
	const start = startOfMonth(new Date())
	const end = endOfMonth(start)
	const allDays = eachDayOfInterval({ start, end })

	return allDays.filter(day => isSunday(day))
}
