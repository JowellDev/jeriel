import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireRole } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import type { Member } from '~/models/member.model'
import { filterSchema } from '../../schema'
import { getFilterOptions } from '../../utils'
import { parseISO } from 'date-fns'
import {
	fetchAttendancesByMemberIds,
	getMemberQuery,
	prepareDateRanges,
} from '~/helpers/attendance.server'
import { getMembersAttendances } from '~/shared/attendance'

function parseLoaderParams(request: Request) {
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
	const currentUser = await requireRole(request, ['ADMIN'])

	const { value, fromDate, dateRanges } = parseLoaderParams(request)

	const where = getFilterOptions(value, currentUser)

	const [total, m] = await Promise.all(getMemberQuery(where, value))

	const members = m as Member[]

	const memberIds = members.map(m => m.id)
	const [allAttendances, previousAttendances] = await Promise.all([
		fetchAttendancesByMemberIds(memberIds, fromDate, dateRanges.toDate),
		fetchAttendancesByMemberIds(
			memberIds,
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
		filterData: value,
	}
}

export type LoaderType = typeof loaderFn
