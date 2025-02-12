import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import type { Member } from '~/models/member.model'
import { filterSchema } from './schema'
import { getFilterOptions } from './utils/server'
import { parseISO } from 'date-fns'
import {
	fetchAttendanceData,
	getMemberQuery,
	prepareDateRanges,
} from '~/utils/attendance.server'
import { getMembersAttendances } from '~/shared/attendance'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

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

	const where = getFilterOptions(value, currentUser)

	const memberQuery = getMemberQuery(where, value)
	const [total, m] = await Promise.all(memberQuery)

	const members = m as Member[]

	const memberIds = members.map(m => m.id)

	const { allAttendances, previousAttendances } = await fetchAttendanceData(
		currentUser,
		memberIds,
		fromDate,
		processedToDate,
		previousFrom,
		previousTo,
	)

	return json({
		total: total as number,
		members: getMembersAttendances(
			members as Member[],
			allAttendances,
			previousAttendances,
			currentMonthSundays,
			previousMonthSundays,
		),
		filterData: value,
	})
}

export type LoaderType = typeof loaderFn
