import { registerQueue } from '~/helpers/queue'
import {
	processAttendanceConflicts,
	type AttendanceConflictsJobData,
} from './attendance-conflicts.processor'

export const attendanceConflictsQueue =
	registerQueue<AttendanceConflictsJobData>(
		'attendance-conflicts',
		processAttendanceConflicts,
		{
			concurrency: 1,
		},
	)

export async function enqueueAttendanceConflictsCheck() {
	return attendanceConflictsQueue.add(
		'check-attendance-conflicts',
		{},
		{
			removeOnComplete: true,
			removeOnFail: false,
		},
	)
}
