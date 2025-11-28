import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireRole } from '~/utils/auth.server'
import { filterSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { parseISO } from 'date-fns'
import { formatOptions, getFilterOptions } from './utils.server'
import type { Member } from '~/models/member.model'
import { getMembersAttendances } from '~/shared/attendance'
import {
	prepareDateRanges,
	getMemberQuery,
	fetchAttendanceData,
	fetchAllEntityMembers,
} from '~/helpers/attendance.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireRole(request, ['TRIBE_MANAGER'])

	const { churchId, tribeId } = currentUser

	invariant(churchId, 'Church ID is required')
	invariant(tribeId, 'Department ID is required')

	if (tribeId) {
		currentUser.departmentId = null
		currentUser.honorFamilyId = null
	}

	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const { value } = submission
	const fromDate = parseISO(value.from)
	const toDate = parseISO(value.to)

	const {
		toDate: processedToDate,
		currentMonthSundays,
		previousMonthSundays,
		previousFrom,
		previousTo,
	} = prepareDateRanges(toDate)

	const where = getFilterOptions(formatOptions(value), currentUser)

	const memberQuery = getMemberQuery(where, value)
	const [total, m] = await Promise.all(memberQuery)

	const members = m as Member[]

	const memberIds = members.map(m => m.id)

	const allMembers = await fetchAllEntityMembers(currentUser)

	const { services, allAttendances, previousAttendances } =
		await fetchAttendanceData(
			currentUser,
			memberIds,
			fromDate,
			processedToDate,
			previousFrom,
			previousTo,
		)

	return {
		total: total as number,
		members: getMembersAttendances(
			members as Member[],
			currentMonthSundays,
			previousMonthSundays,
			allAttendances,
			previousAttendances,
		),
		allMembers,
		filterData: value,
		tribeId: currentUser.tribeId ?? '',
		services,
	} as const
}

export type LoaderType = typeof loaderFn
