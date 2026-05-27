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

function parseFilterParams(request: Request) {
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})
	invariant(submission.status === 'success', 'params must be defined')
	const { value } = submission
	const fromDate = parseISO(value.from)
	const dateRanges = prepareDateRanges(parseISO(value.to))
	return { value, fromDate, dateRanges }
}

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireRole(request, ['TRIBE_MANAGER'])
	const { churchId, tribeId } = currentUser
	invariant(churchId, 'Church ID is required')
	invariant(tribeId, 'Department ID is required')
	currentUser.departmentId = null
	currentUser.honorFamilyId = null

	const { value, fromDate, dateRanges } = parseFilterParams(request)
	const where = getFilterOptions(formatOptions(value), currentUser)
	const [total, m] = await Promise.all(getMemberQuery(where, value))
	const members = m as Member[]

	const [allMembers, { services, allAttendances, previousAttendances }] =
		await Promise.all([
			fetchAllEntityMembers(currentUser),
			fetchAttendanceData(
				currentUser,
				members.map(m => m.id),
				fromDate,
				dateRanges.toDate,
				dateRanges.previousFrom,
				dateRanges.previousTo,
			),
		])

	return {
		total: total as number,
		members: getMembersAttendances(
			members,
			dateRanges.currentMonthSundays,
			dateRanges.previousMonthSundays,
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
