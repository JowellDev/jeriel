import { Queue } from 'quirrel/remix'
import { NEW_NOTIFICATION_EVENT } from '~/shared/constants'
import { prisma } from '~/infrastructures/database/prisma.server'
import { emitter } from '~/utils/emitter'
import { sendMessage } from '~/shared/message-sender.server'

export type InAppNotification = {
	title: string
	content: string
	url: string
	userId: string
}

export type SMSNotification = {
	content: string
	phone: string
}

export type NotificationEvent = {
	title: string
	content: string
	userId: string
	notificationId: string
	url?: string
	refresher?: number
}

export interface NotificationJobData {
	inApp?: InAppNotification
	sms?: SMSNotification
}

async function saveInAppNotification({
	title,
	content,
	url,
	userId,
}: InAppNotification) {
	return prisma.notification.create({
		data: {
			title,
			content,
			url,
			userId,
		},
	})
}

export const notificationQueue = Queue<NotificationJobData>(
	'queues/notifications',
	async ({ inApp, sms }) => {
		try {
			console.info('=====> Démarrage de la file de notification <=====')

			if (inApp) {
				const notification = await saveInAppNotification(inApp)

				emitter.emit(NEW_NOTIFICATION_EVENT, {
					title: inApp.title,
					content: inApp.content,
					userId: inApp.userId,
					url: inApp.url,
					notificationId: notification.id,
				} as NotificationEvent)
			}

			if (sms) {
				await sendMessage(sms.content, sms.phone)
			}

			console.info('=====> Fin de la file de notification <=====')
		} catch (error) {
			console.error(
				'Une erreur est survenue dans la file de notification:',
				error,
			)
			throw error
		}
	},
)
