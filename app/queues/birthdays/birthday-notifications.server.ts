import { registerQueue } from '~/helpers/queue'
import { processBirthdays, type BirthdaysJobData } from './birthdays.processor'

export const birthdaysQueue = registerQueue<BirthdaysJobData>(
	'birthdays',
	processBirthdays,
	{
		concurrency: 1,
	},
)

export async function enqueueWeeklyBirthdayNotifications() {
	return birthdaysQueue.add(
		'weekly-birthday-notifications',
		{ type: 'weekly-notifications' },
		{
			removeOnComplete: true,
			removeOnFail: false,
		},
	)
}

export async function enqueueDailyBirthdaySms() {
	return birthdaysQueue.add(
		'daily-birthday-sms',
		{ type: 'daily-sms' },
		{
			removeOnComplete: true,
			removeOnFail: false,
		},
	)
}
