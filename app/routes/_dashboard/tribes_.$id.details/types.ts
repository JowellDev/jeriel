import type { Member } from '~/models/member.model'
import { type z } from 'zod'
import { type paramsSchema } from './schema'

export type MemberFilterOptions = z.infer<typeof paramsSchema>

export interface Tribe {
	id: string
	name: string
	manager: Member
	createdAt: Date
}

export const Views = {
	CULTE: 'culte',
	SERVICE: 'service',
	STAT: 'stat',
}

export type ViewOption = (typeof Views)[keyof typeof Views]
