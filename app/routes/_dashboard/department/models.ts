import type { Member } from '~/models/member.model'
import { type z } from 'zod'
import { type paramsSchema } from './schema'
import type { MonthlyAttendance } from '~/shared/attendance'

export type MemberFilterOptions = z.infer<typeof paramsSchema>

export interface Department {
	id: string
	name: string
	manager: Member
	createdAt: Date
}

export interface MemberWithMonthlyAttendances extends Member {
	lastMonthAttendanceResume: MonthlyAttendance
	currentMonthAttendanceResume: MonthlyAttendance
	currentMonthAttendances: { sunday: Date; isPresent?: boolean }[]
}
