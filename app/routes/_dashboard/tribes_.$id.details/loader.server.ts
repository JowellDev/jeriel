import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { prisma } from '~/utils/db.server'
import { normalizeDate } from '~/utils/date'
import type { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import type { Member } from '~/models/member.model'
import { Role, type Prisma } from '@prisma/client'
import type { MemberFilterOptions, Tribe } from './types'
import { paramsSchema } from './schema'
import { MemberStatus } from '~/shared/enum'
import { parseISO } from 'date-fns'
import {
	fetchAttendanceData,
	getMemberQuery,
	prepareDateRanges,
} from '~/utils/attendance.server'
import { getMembersAttendances } from '~/shared/attendance'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	const { id } = params

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: paramsSchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const { value } = submission

	const tribe = await prisma.tribe.findUnique({
		where: { id: id },
		include: { manager: true },
	})

	if (!tribe) {
		throw new Response('Not Found', { status: 404 })
	}

	const fromDate = parseISO(value.from)
	const toDate = parseISO(value.to)

	const {
		toDate: processedToDate,
		currentMonthSundays,
		previousMonthSundays,
		previousFrom,
		previousTo,
	} = prepareDateRanges(toDate)

	const where = getFilterOptions(
		formatOptions(value),
		tribe as unknown as Tribe,
	)

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

	const tribeAssistants = (await prisma.user.findMany({
		where: {
			tribeId: tribe.id,
			id: { not: tribe.manager.id },
			roles: { has: Role.TRIBE_MANAGER },
		},
		include: { integrationDate: true },
	})) as Member[]

	const membersCount = await prisma.user.count({ where: { tribeId: tribe.id } })

	return json({
		tribe: {
			id: tribe.id,
			name: tribe.name,
			manager: tribe.manager,
			createdAt: tribe.createdAt,
		},
		total,
		tribeAssistants,
		membersCount,
		members: getMembersAttendances(
			members,
			allAttendances,
			previousAttendances,
			currentMonthSundays,
			previousMonthSundays,
		),
		filterData: value,
	})
}

export type loaderData = typeof loaderFn

function getFilterOptions(
	params: z.infer<typeof paramsSchema>,
	tribe: Tribe,
): Prisma.UserWhereInput {
	const contains = `%${params.query.replace(/ /g, '%')}%`

	return {
		tribeId: tribe.id,
		id: { not: tribe.manager.id },
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
		...getDateFilterOptions(params),
	}
}

function getDateFilterOptions(options: MemberFilterOptions) {
	const { status, to, from } = options

	const isAll = status === 'ALL'
	const statusEnabled = !!status && !isAll
	const isNew = status === MemberStatus.NEW

	const startDate = normalizeDate(new Date(from), 'start')
	const endDate = normalizeDate(new Date(to), 'end')

	return {
		...(!statusEnabled && { createdAt: { lte: endDate } }),
		...(statusEnabled
			? {
					createdAt: isNew
						? { gte: startDate, lte: endDate }
						: { lte: startDate },
				}
			: { createdAt: { lte: endDate } }),
	}
}

function formatOptions(options: MemberFilterOptions) {
	const filterOptions: any = {}

	for (const [key, value] of Object.entries(options)) {
		filterOptions[key] = value.toLocaleString() === 'ALL' ? undefined : value
	}

	return filterOptions
}
