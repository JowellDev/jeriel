import { type z } from 'zod'
import { type paramsSchema } from './schema'

export type MemberFilterOptions = z.infer<typeof paramsSchema>
