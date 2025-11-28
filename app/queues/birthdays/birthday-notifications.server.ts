import { Queue } from 'quirrel/remix'
import {
	notifyManagersAboutUpcomingBirthdays,
	sendBirthdaySmsForMember,
} from '~/helpers/birthdays.server'

export const birthdaysQueue = Queue('queues/birthdays', async () => {
	console.info('=====> Lancement du job hebdomadaire des anniversaires <=====')
	await notifyManagersAboutUpcomingBirthdays()
	console.info('=====> Fin du job hebdomadaire des anniversaires <=====')
})

export const birthdayCronJob = Queue('queues/birthdays', async () => {
	console.info("Démarrage de la tâche cron d'anniversaire...")
	await sendBirthdaySmsForMember()
})
