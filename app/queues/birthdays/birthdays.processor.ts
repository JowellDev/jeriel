import { type Job } from 'bullmq'
import {
	notifyManagersAboutUpcomingBirthdays,
	sendBirthdaySmsForMember,
} from '~/helpers/birthdays.server'
import { bullmqLogger } from '~/helpers/queue'

export interface BirthdaysJobData {
	type: 'weekly-notifications' | 'daily-sms'
}

export async function processBirthdays(job: Job<BirthdaysJobData>) {
	const { type } = job.data

	try {
		if (type === 'weekly-notifications') {
			bullmqLogger.info(
				`Lancement du job hebdomadaire des anniversaires - Job ${job.id}`,
			)
			await notifyManagersAboutUpcomingBirthdays()
			bullmqLogger.info('Fin du job hebdomadaire des anniversaires')
		} else if (type === 'daily-sms') {
			bullmqLogger.info(
				`Démarrage de la tâche cron d'anniversaire (SMS) - Job ${job.id}`,
			)
			await sendBirthdaySmsForMember()
			bullmqLogger.info("Fin de la tâche cron d'anniversaire (SMS)")
		}
	} catch (error) {
		bullmqLogger.error(`Erreur dans le job d'anniversaires (${type})`, {
			extra: { error },
		})

		throw error
	}
}
