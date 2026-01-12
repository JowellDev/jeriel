import { attendanceConflictsQueue } from '~/queues/attendance-conflicts.queue'
import { birthdaysQueue } from '~/queues/birthdays.queue'
import { reportTrackingQueue } from '~/queues/report-tracking.queue'
import { bullmqLogger } from './queue'

const logger = bullmqLogger.child({ module: 'cron-scheduler' })

export async function initializeCronJobs() {
	try {
		logger.info('Initializing cron jobs...')

		const attendanceConflictsCron = process.env.CHECK_ATTENDANCE_CONFLICT_CRON
		if (attendanceConflictsCron) {
			await attendanceConflictsQueue.add(
				'check-conflicts',
				{},
				{
					repeat: {
						pattern: attendanceConflictsCron,
					},
					jobId: 'attendance-conflicts-cron',
				},
			)
			logger.info(
				`✓ Attendance conflicts cron scheduled: ${attendanceConflictsCron}`,
			)
		} else {
			logger.warn('⚠ CHECK_ATTENDANCE_CONFLICT_CRON not set')
		}

		const reportTrackingCron = process.env.REPORT_TRACKING_CRON
		if (reportTrackingCron) {
			await reportTrackingQueue.add(
				'sync-tracking',
				{},
				{
					repeat: {
						pattern: reportTrackingCron,
					},
					jobId: 'report-tracking-cron',
				},
			)
			logger.info(`✓ Report tracking cron scheduled: ${reportTrackingCron}`)
		} else {
			logger.warn('⚠ REPORT_TRACKING_CRON not set')
		}

		const birthdaysCron = process.env.BIRTHDAYS_CRON
		if (birthdaysCron) {
			await birthdaysQueue.add(
				'daily-sms',
				{ type: 'daily-sms' },
				{
					repeat: {
						pattern: birthdaysCron,
					},
					jobId: 'birthdays-daily-sms-cron',
				},
			)

			logger.info(`✓ Birthdays daily SMS cron scheduled: ${birthdaysCron}`)

			await birthdaysQueue.add(
				'weekly-summary',
				{ type: 'weekly-summary' },
				{
					repeat: {
						pattern: '0 8 * * 1',
					},
					jobId: 'birthdays-weekly-summary-cron',
				},
			)
			logger.info('✓ Birthdays weekly summary cron scheduled: 0 8 * * 1')
		} else {
			logger.warn('⚠ BIRTHDAYS_CRON not set')
		}

		logger.info('✅ All cron jobs initialized successfully')
	} catch (error) {
		logger.error('❌ Error initializing cron jobs', { extra: { error } })
		throw error
	}
}

export async function removeAllCronJobs() {
	try {
		logger.info('Removing all cron jobs...')

		await attendanceConflictsQueue.removeRepeatable('check-conflicts', {
			pattern: process.env.CHECK_ATTENDANCE_CONFLICT_CRON || '',
		})

		await reportTrackingQueue.removeRepeatable('sync-tracking', {
			pattern: process.env.REPORT_TRACKING_CRON || '',
		})

		await birthdaysQueue.removeRepeatable('daily-sms', {
			pattern: process.env.BIRTHDAYS_CRON || '',
		})

		await birthdaysQueue.removeRepeatable('weekly-summary', {
			pattern: '0 8 * * 1',
		})

		logger.info('✅ All cron jobs removed successfully')
	} catch (error) {
		logger.error('❌ Error removing cron jobs', { extra: { error } })
	}
}
