import { type Job } from 'bullmq'
import { prisma } from '~/infrastructures/database/prisma.server'
import { emitter } from '~/utils/emitter'
import { sendMessage } from '~/shared/message-sender.server'
import { NEW_NOTIFICATION_EVENT } from '~/shared/constants'
import { bullmqLogger, registerQueue } from '~/helpers/queue'

type InAppNotification = {
	title: string
	content: string
	url: string
	userId: string
}

type SMSNotification = {
	content: string
	phone: string
}

type NotificationEvent = {
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

const logger = bullmqLogger.child({ module: 'bullmq.notification' })

async function job(job: Job<NotificationJobData>) {
	const { inApp, sms } = job.data

	try {
		logger.info(`Démarrage du job de notification ${job.id}`)

		if (inApp) {
			const notification = await saveInAppNotification(inApp)

			emitter.emit(NEW_NOTIFICATION_EVENT, {
				title: inApp.title,
				content: inApp.content,
				userId: inApp.userId,
				url: inApp.url,
				notificationId: notification.id,
			} as NotificationEvent)

			logger.info(
				`Notification in-app créée pour l'utilisateur ${inApp.userId}`,
			)
		}

		if (sms) {
			await sendMessage(sms.content, sms.phone)
			logger.info(`SMS envoyé au numéro ${sms.phone}`)
		}

		logger.info(`Fin du job de notification ${job.id}`)
	} catch (error) {
		logger.error(`Erreur dans le job de notification ${job.id}`, {
			extra: { error },
		})

		throw error
	}
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

const queue = registerQueue<NotificationJobData>('send-notification', job)

export { queue as notificationQueue }
export type { InAppNotification, SMSNotification, NotificationEvent }
