import { type Job } from 'bullmq'
import { prisma } from '~/infrastructures/database/prisma.server'
import { emitter } from '~/utils/emitter'
import { sendMessage } from '~/shared/message-sender.server'
import { NEW_NOTIFICATION_EVENT } from '~/shared/constants'
import { bullmqLogger } from '~/helpers/queue'

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

export async function processNotification(job: Job<NotificationJobData>) {
	const { inApp, sms } = job.data

	try {
		bullmqLogger.info(`Démarrage du job de notification ${job.id}`)

		if (inApp) {
			const notification = await saveInAppNotification(inApp)

			emitter.emit(NEW_NOTIFICATION_EVENT, {
				title: inApp.title,
				content: inApp.content,
				userId: inApp.userId,
				url: inApp.url,
				notificationId: notification.id,
			} as NotificationEvent)

			bullmqLogger.info(
				`Notification in-app créée pour l'utilisateur ${inApp.userId}`,
			)
		}

		if (sms) {
			await sendMessage(sms.content, sms.phone)
			bullmqLogger.info(`SMS envoyé au numéro ${sms.phone}`)
		}

		bullmqLogger.info(`Fin du job de notification ${job.id}`)
	} catch (error) {
		bullmqLogger.error(`Erreur dans le job de notification ${job.id}`, {
			extra: { error },
		})
		throw error
	}
}
