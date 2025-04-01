import { type z } from 'zod'
import { type filterSchema } from './schema'

export type MemberFilterOptions = z.infer<typeof filterSchema>

export type NotificationFormated = {
	id: string
	title: string
	content: string
	url: string
	user: {
		id: string
		name: string
	}
	readAt?: Date | string | null
	createdAt: Date | string
}

export type NotificationFilter = 'all' | 'unread'
