import type { z } from 'zod'
import type { filterSchema } from './schema'

export interface SelectOption {
	label: string
	value: string
}

export type MemberFilterOptions = z.infer<typeof filterSchema>

export type Attendance = {
	memberId: string
	date: Date
	inChurch: boolean
	inService: boolean | null
	inMeeting: boolean | null
	hasConflict: boolean
}

export interface MonthlyAttendanceResume {
	total: number
	presentInChurch: number
	presentInService: number
	presentInMeeting: number
	churchPercentage: number
	servicePercentage: number
	meetingPercentage: number
}

export interface StatisticItem {
	name: string
	value: number
	color: string
}

export interface AttendanceData {
	total: number
	date: string
	stats: AttendanceItem[]
	memberStats: StatisticItem[]
}

export interface AttendanceItem {
	type: string
	percentage: string
	color: string
	lottieData: Record<string, unknown> | null
}
