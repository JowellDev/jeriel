import { type Job } from 'bullmq'
import {
	notifyManagersAboutUpcomingBirthdays,
	sendBirthdaySmsForMember,
} from '~/helpers/birthdays.server'
import { bullmqLogger, registerQueue } from '~/helpers/queue'

interface BirthdaysJobData {
	type: 'weekly-summary' | 'daily-sms'
}

const logger = bullmqLogger.child({ module: 'bullmq.birthdays' })

export async function job(job: Job<BirthdaysJobData>) {
	const { type } = job.data

	try {
		if (type === 'weekly-summary') {
			logger.info(
				`Lancement du job hebdomadaire des anniversaires - Job ${job.id}`,
			)

			await notifyManagersAboutUpcomingBirthdays()

			logger.info('Fin du job hebdomadaire des anniversaires')
		} else if (type === 'daily-sms') {
			logger.info(
				`Démarrage de la tâche cron d'anniversaire (SMS) - Job ${job.id}`,
			)

			await sendBirthdaySmsForMember()

			logger.info("Fin de la tâche cron d'anniversaire (SMS)")
		}
	} catch (error) {
		logger.error(`Erreur dans le job d'anniversaires (${type})`, {
			extra: { error },
		})

		throw error
	}
}

const birthdaysQueue = registerQueue<BirthdaysJobData>('birthdays', job)

export { birthdaysQueue }
export type { BirthdaysJobData }
