import { MonthlyAttendance } from '~/shared/attendance'

export type HonorFamily = {
	id: string
	name: string
	createdAt: Date
	location: string
	members: { id: string; name: string }[]
	manager: { id: string; name: string; phone: string; isAdmin: boolean }
}

export interface MemberWithMonthlyAttendances extends Member {
	lastMonthAttendanceResume: MonthlyAttendance
	currentMonthAttendanceResume: MonthlyAttendance
	currentMonthAttendances: { sunday: Date; isPresent?: boolean }[]
}

export type LoadingApiFormData = {
	admins: (SelectInputData & { isAdmin: boolean })[]
	members: SelectInputData[]
}

export interface Member {
	id: string
	name: string
	phone: string
	location: string
	createdAt: Date
}

type SelectInputData = { label: string; value: string }

export const Views = {
	CULTE: 'culte',
	SERVICE: 'service',
	STAT: 'stat',
}

export type ViewOption = (typeof Views)[keyof typeof Views]
