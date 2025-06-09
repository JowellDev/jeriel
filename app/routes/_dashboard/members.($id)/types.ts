import { type z } from 'zod'
import { type filterSchema } from './schema'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import type { Params } from '@remix-run/react'

export type MemberFilterOptions = z.infer<typeof filterSchema>

export type MemberExportedData = {
	name: string
	location: string | null
	phone: string
	createdAt: Date
}

export type ExportMemberFileParams = {
	feature: string
	customerName: string
	members: MemberMonthlyAttendances[]
}

export interface ActionHandlerParams {
	request: Request
	params: Params<string>
}
