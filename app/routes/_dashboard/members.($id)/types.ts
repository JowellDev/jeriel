import { type z } from 'zod'
import { type filterSchema } from './schema'

export type MemberFilterOptions = z.infer<typeof filterSchema>

export type MemberExportedData = {
	name: string
	location: string | null
	phone: string
	createdAt: Date
}
