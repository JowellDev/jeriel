import { z } from 'zod'
import type { MonthlyAttendance } from '~/shared/attendance'
import { paramsSchema } from './schema'

export type MemberFilterOptions = z.infer<typeof paramsSchema>

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

export type SelectInputData = {
	label: string
	value: string
	isAdmin?: boolean
}

export const Views = {
	CULTE: 'culte',
	SERVICE: 'service',
	STAT: 'stat',
}

export type ViewOption = (typeof Views)[keyof typeof Views]
