import type { MonthlyAttendance } from '~/shared/attendance'
import type { paramsSchema } from './schema'
import type { z } from 'zod'

export type MemberFilterOptions = z.infer<typeof paramsSchema>

export interface MemberWithMonthlyAttendances extends Member {
	lastMonthAttendanceResume: MonthlyAttendance
	currentMonthAttendanceResume: MonthlyAttendance
	currentMonthAttendances: { sunday: Date; isPresent?: boolean }[]
}

export interface Member {
	id: string
	name: string
	phone: string
	location: string
	createdAt: Date
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
