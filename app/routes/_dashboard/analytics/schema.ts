import { startOfMonth, endOfMonth } from 'date-fns'
import { z } from 'zod'
import { ANALYTICS_TABS, EXPORT_DATASETS } from './constants'

export const analyticsFilterSchema = z.object({
	tab: z.enum(ANALYTICS_TABS).default('overview'),
	entityType: z.enum(['tribe', 'department', 'honorFamily']).optional(),
	entityId: z.string().optional(),
	from: z.string().default(() => startOfMonth(new Date()).toISOString()),
	to: z.string().default(() => endOfMonth(new Date()).toISOString()),
})

export type AnalyticsFilter = z.infer<typeof analyticsFilterSchema>

export const exportSchema = analyticsFilterSchema.extend({
	intent: z.literal('export'),
	dataset: z.enum(EXPORT_DATASETS),
})
