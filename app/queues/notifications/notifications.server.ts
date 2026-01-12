import { registerQueue } from '~/helpers/queue'
import {
	processNotification,
	type NotificationJobData,
	type InAppNotification,
	type SMSNotification,
	type NotificationEvent,
} from './notifications.processor'

export type { InAppNotification, SMSNotification, NotificationEvent }

export const notificationQueue = registerQueue<NotificationJobData>(
	'notifications',
	processNotification,
	{
		concurrency: 10,
		rateLimit: {
			max: 100,
			duration: 60000, // 100 jobs per minute
		},
	},
)

export async function enqueueNotification(data: NotificationJobData) {
	return notificationQueue.add('send-notification', data, {
		removeOnComplete: true,
		removeOnFail: false,
	})
}
