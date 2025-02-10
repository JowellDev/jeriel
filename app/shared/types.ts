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
