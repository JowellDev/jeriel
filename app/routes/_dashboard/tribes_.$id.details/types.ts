import { type MonthlyAttendance } from '~/shared/attendance'

export interface Tribe {
	id: string
	name: string
	members: MemberWithMonthlyAttendances[]
	manager: Member
	createdAt: Date
}

export interface Member {
	id: string
	name: string
	phone: string
	isAdmin?: boolean
	location: string
	createdAt: Date
}

export interface MemberWithMonthlyAttendances extends Member {
	lastMonthAttendanceResume: MonthlyAttendance
	currentMonthAttendanceResume: MonthlyAttendance
	currentMonthAttendances: { sunday: Date; isPresent?: boolean }[]
}

export const Views = {
	CULTE: 'culte',
	SERVICE: 'service',
	STAT: 'stat',
}

export type ViewOption = (typeof Views)[keyof typeof Views]
