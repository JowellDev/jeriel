import { registerQueue } from '~/helpers/queue'
import {
	processReportTracking,
	type ReportTrackingJobData,
} from './report-tracking.processor'

export const reportTrackingQueue = registerQueue<ReportTrackingJobData>(
	'report-tracking',
	processReportTracking,
	{
		concurrency: 1,
	},
)

export async function enqueueReportTracking() {
	return reportTrackingQueue.add(
		'sync-report-tracking',
		{},
		{
			removeOnComplete: true,
			removeOnFail: false,
		},
	)
}
