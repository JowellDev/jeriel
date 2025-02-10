import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { filterSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { parseISO } from 'date-fns'

import {
	fetchAttendanceData,
	formatOptions,
	getFilterOptions,
	getMemberQuery,
	getMembersAttendances,
	prepareDateRanges,
} from './utils.server'
import type { Member } from '~/models/member.model'

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

	const where = getFilterOptions(formatOptions(value), currentUser)

	const memberQuery = getMemberQuery(where, value)
	const [total, m] = await Promise.all(memberQuery)

	const members = m as Member[]

	const memberIds = members.map(m => m.id)

	const { services, allAttendances, previousAttendances } =
		await fetchAttendanceData(
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
		tribeId: currentUser.tribeId ?? '',
		services,
	} as const)
}

export type LoaderType = typeof loaderFn
