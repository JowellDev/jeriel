import { z } from 'zod'
import { type MemberStatus, type AttendanceState } from './enum'
import type { MaritalStatus } from '@prisma/client'

export const PWD_REGEX =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/

export const PWD_ERROR_MESSAGE = {
	min: `Le mot de passe doit contenir au moins 8 caractères`,
	invalid: `Le mot de passe doit contenir au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial`,
}

export const PHONE_NUMBER_REGEX = /^(225\d{10}|\d{10})$/
export const MOBILE_WIDTH = '(min-width: 768px)'

export const DEFAULT_QUERY_TAKE = 15

export const ACCEPTED_EXCEL_MIME_TYPES = [
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.ms-excel',
]

export const frenchAttendanceState: Record<AttendanceState, string> = {
	VERY_REGULAR: 'Très régulier',
	REGULAR: 'Régulier',
	MEDIUM_REGULAR: 'Moyennement régulier',
	LITTLE_REGULAR: 'Peu régulier',
	ABSENT: 'Absent',
}

export const servicefrenchAttendanceState: Record<AttendanceState, string> = {
	VERY_REGULAR: 'Très actif',
	REGULAR: 'Actif',
	MEDIUM_REGULAR: 'Moyennement Actif',
	LITTLE_REGULAR: 'Peu Actif',
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

export const chartAttendanceStateEmoji: Record<number, string> = {
	5: '🤩',
	4: '😇',
	3: '😊',
	2: '😐',
	1: '😭',
}

export const MEMBER_SCHEMA = z.object({
	name: z.string(),
	phone: z.string().regex(PHONE_NUMBER_REGEX, {
		message: 'Numéro de telephone invalide',
	}),
	location: z.string(),
	birthday: z.date().optional(),
	gender: z
		.enum(['F', 'M'], {
			message: 'Le genre doit être F ou M',
		})
		.optional(),
	maritalStatus: z
		.enum(['MARRIED', 'ENGAGED', 'WIDOWED', 'SINGLE', 'COHABITING'], {
			message:
				'Le statut matrimonial doit être MARRIED, ENGAGED, WIDOWED, SINGLE ou COHABITING',
		})
		.optional(),
})

export const stateFilterData = [
	{ value: 'ALL', label: 'Tous les états' },
	{ value: 'VERY_REGULAR', label: 'Tres régulier' },
	{ value: 'REGULAR', label: 'Régulier' },
	{ value: 'MEDIUM_REGULAR', label: 'Moyennement régulier' },
	{ value: 'LITTLE_REGULAR', label: 'Peu régulier' },
	{ value: 'ABSENT', label: 'Absent' },
]

export const statusFilterData = [
	{ value: 'ALL', label: 'Tous les statuts' },
	{ value: 'NEW', label: 'Nouveau' },
	{ value: 'OLD', label: 'Ancien' },
]

export const FORM_INTENT = {
	CREATE: 'create_member',
	UPLOAD: 'upload_members',
	ADD_ASSISTANT: 'add_assistant',
}

export const NEW_NOTIFICATION_EVENT = 'new-notification'

export const MaritalStatusValue: Record<MaritalStatus, string> = {
	SINGLE: 'Celibataire',
	ENGAGED: 'Fiancé(e)',
	COHABITING: 'Concubinage',
	MARRIED: 'Marié(e)',
	WIDOWED: 'Veuf/veuve',
}

export const MaritalStatuSelectOptions = [
	{ value: 'SINGLE', label: 'Célibataire' },
	{ value: 'ENGAGED', label: 'Fiancé(e)' },
	{ value: 'COHABITING', label: 'Concubinage' },
	{ value: 'MARRIED', label: 'Marié(e)' },
	{ value: 'WIDOWED', label: 'Veuf/veuve' },
]
