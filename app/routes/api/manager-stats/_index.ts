import { parseWithZod } from '@conform-to/zod'
import { type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { prepareDateRanges } from '~/helpers/attendance.server'
import { schema } from './schema'
import {
	getAuthorizedEntities,
	getEntityMembers,
	fetchAttendanceReports,
	getAttendancesStats,
} from './utils.server'

export type { EntityType, AuthorizedEntity, Attendance, AttendanceReport, AttendanceStats, CategoryStats } from './types'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema })

	if (submission.status !== 'success') return 'error'

	invariant(currentUser.churchId, '')

	const { value } = submission
	const { currentMonthSundays } = prepareDateRanges(new Date(value.to))

	const authorizedEntities = await getAuthorizedEntities(currentUser)

	const selectedEntity =
		value.entityType && value.entityId
			? authorizedEntities.find(
					entity =>
						entity.type === value.entityType && entity.id === value.entityId,
				)
			: authorizedEntities[0]

	invariant(selectedEntity, 'Impossible de sélectionner une entité valide.')

	const allMembers = await getEntityMembers(
		[selectedEntity],
		currentUser.churchId,
		currentUser.id,
	)

	const memberIds = allMembers.map(m => m.id)

	const attendancesReports = await fetchAttendanceReports(
		[selectedEntity],
		memberIds,
		value,
	)

	const stats = getAttendancesStats(allMembers, attendancesReports, currentMonthSundays)

	return { stats }
}
