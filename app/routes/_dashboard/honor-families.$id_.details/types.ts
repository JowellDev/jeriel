import type { z } from 'zod'
import type { MonthlyAttendance } from '~/shared/attendance'
import type { paramsSchema } from './schema'

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

export interface GetHonorFamilyMembersData {
	id: string
	filterData: MemberFilterOptions
}

export interface GetHonorFamilyAssistantsData {
	churchId: string
	id: string
	managerId: string
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

export enum VIEWS {
	CULTE = 'CULTE',
	SERVICE = 'SERVICE',
	STAT = 'STAT',
}

export type ViewOption = keyof typeof VIEWS
