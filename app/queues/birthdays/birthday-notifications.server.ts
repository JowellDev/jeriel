import { Queue } from 'quirrel/remix'
import { notifyManagersAboutUpcomingBirthdays } from '~/utils/birthdays.server'

export const birthdaysQueue = Queue('queues/birthdays', async () => {
	console.info('=====> Lancement du job hebdomadaire des anniversaires <=====')
	await notifyManagersAboutUpcomingBirthdays()
	console.info('=====> Fin du job hebdomadaire des anniversaires <=====')
})
