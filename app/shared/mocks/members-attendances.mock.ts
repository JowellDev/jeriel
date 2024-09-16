import type { MemberMonthlyAttendances } from '~/models/member.model'
import { getMonthSundays } from '~/utils/date'

export function getFakeMembersAttendanceData(count: number = 10) {
	const currentMonthSundays = getMonthSundays(new Date())

	return new Array(count).fill(null).map((_, index) => ({
		id: `${index + 1}`,
		name: 'John Doe John Doe John Doe',
		phone: '225 0758992417',
		location: 'France',
		createdAt: new Date(),
		previousMonthAttendanceResume: {
			attendance: Math.floor(Math.random() * 4),
			sundays: 4,
		},
		currentMonthAttendanceResume: {
			attendance: Math.floor(Math.random() * 4),
			sundays: 4,
		},
		currentMonthAttendances: currentMonthSundays.map((sunday: any) => ({
			sunday,
			isPresent: Math.random() > 0.5,
		})),
	})) as MemberMonthlyAttendances[]
}
