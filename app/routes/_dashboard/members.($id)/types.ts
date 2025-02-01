import { type z } from 'zod'
import { type filterSchema } from './schema'
import { MemberMonthlyAttendances } from '~/models/member.model'

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
