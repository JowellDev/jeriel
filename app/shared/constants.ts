import { z } from 'zod'
import { type MemberStatus, type AttendanceState } from './enum'
import { type SelectOption } from './types'

export const PWD_REGEX =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/

export const PHONE_NUMBER_REGEX = /^(225\d{10}|\d{10})$/
export const MOBILE_WIDTH = '(min-width: 768px)'

export const SELECT_ALL_OPTION: SelectOption = { label: 'Tous', value: 'all' }

export const frenchAttendanceState: Record<AttendanceState, string> = {
	VERY_REGULAR: 'Tres régulier',
	REGULAR: 'Régulier',
	MEDIUM_REGULAR: 'Moyennement régulier',
	LITTLE_REGULAR: 'Peu régulier',
	ABSENT: 'Absent',
}

export const frenchMemberStatus: Record<MemberStatus, string> = {
	OLD: 'Ancien',
	NEW: 'Nouveau',
}

export const attendanceStateEmoji: Record<AttendanceState, string> = {
	VERY_REGULAR: '🤩',
	REGULAR: '😇',
	MEDIUM_REGULAR: '😊',
	LITTLE_REGULAR: '😐',
	ABSENT: '😭',
}

export const MEMBER_SCHEMA = z.object({
	name: z.string(),
	phone: z.string().regex(PHONE_NUMBER_REGEX, {
		message: 'Numéro de numéro invalide',
	}),
	location: z.string(),
})
