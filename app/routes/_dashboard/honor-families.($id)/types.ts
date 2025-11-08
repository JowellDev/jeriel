import type { Prisma } from '@prisma/client'
import type { EXPORT_HONOR_FAMILY_SELECT } from './constants'

export type HonorFamily = {
	id: string
	name: string
	createdAt: Date
	location: string
	members: {
		id: string
		name: string
		email: string | null
		phone: string | null
	}[]
	manager: {
		id: string
		name: string
		phone: string | null
		email: string | null
		isAdmin: boolean
	} | null
}

export type LoadingApiFormData = {
	admins: (SelectInputData & { isAdmin: boolean; email?: string })[]
	members: (SelectInputData & { email?: string })[]
}

export interface Member {
	id: string
	name: string
	phone: string
	location: string
	createdAt: Date
}

export type HonorFamilyExport = Prisma.HonorFamilyGetPayload<{
	select: typeof EXPORT_HONOR_FAMILY_SELECT
}>

type SelectInputData = { label: string; value: string }
