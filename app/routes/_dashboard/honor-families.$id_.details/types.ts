import type { z } from 'zod'
import type { MonthlyAttendance } from '~/shared/attendance'
import type { paramsSchema } from './schema'
import type { Prisma } from '@prisma/client'

export type MemberFilterOptions = z.infer<typeof paramsSchema>

export type Keys = keyof typeof Views

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
	honorFamilyId: string
	filterData: MemberFilterOptions
}

export interface GetHonorFamilyAssistantsData {
	churchId: string
	honorFamilyId: string
	honorFamilyManagerId: string
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
