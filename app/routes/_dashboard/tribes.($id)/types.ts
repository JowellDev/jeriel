import type { Prisma } from '@prisma/client'
import type { EXPORT_TRIBES_SELECT } from './constants'

export interface Tribe {
	id: string
	name: string
	createdAt: Date
	members: { id: string; name: string }[]
	manager: {
		id: string
		name: string
		email: string
		phone: string | null
		isAdmin: boolean
	}
}

export interface Member {
	id: string
	name: string
	email: string | null
	phone: string | null
	location: string
	isAdmin: boolean
	createdAt: Date
}

export type ApiFormData = {
	admins: (SelectInputData & { isAdmin: boolean; email: string | null })[]
	members: SelectInputData[]
}

type SelectInputData = { label: string; value: string }

export interface FileData {
	[key: string]: string
}

export interface CreateMemberPayload {
	name: string
	phone: string
	location: string
}

export type ExportTribesData = Prisma.TribeGetPayload<{
	select: typeof EXPORT_TRIBES_SELECT
}>
