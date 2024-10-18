import { type z } from 'zod'
import { type filterSchema } from './schema'

export type ServiceFilterOptions = z.infer<typeof filterSchema>
