import { type LoaderFunctionArgs } from '@remix-run/node'
import { prisma } from '~/infrastructures/database/prisma.server'
import { type z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import type { Member } from '~/models/member.model'
import { Role, type Prisma } from '@prisma/client'
import type { Tribe } from '../types'
import { paramsSchema } from '../schema'
import { parseISO } from 'date-fns'
import {
	fetchAttendanceData,
	formatOptions,
	getDateFilterOptions,
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

	currentUser.tribeId = tribe.id

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
	const [total, membersStats, tribeAssistants, membersCount] =
		await Promise.all([
			memberQuery[0],
			memberQuery[1],
			prisma.user.findMany({
				where: {
					tribeId: tribe.id,
					id: { not: tribe.manager?.id },
					roles: { has: Role.TRIBE_MANAGER },
				},
				include: { integrationDate: true },
			}),
			prisma.user.count({ where: { tribeId: tribe.id } }),
		])

	const members = membersStats as Member[]

	const memberIds = members.map(m => m.id)

	const { allAttendances, previousAttendances } = await fetchAttendanceData(
		currentUser,
		memberIds,
		fromDate,
		processedToDate,
		previousFrom,
		previousTo,
	)

	return {
		tribe: {
			id: tribe.id,
			name: tribe.name,
			manager: tribe.manager,
			createdAt: tribe.createdAt,
		},
		total: total as number,
		tribeAssistants,
		membersCount,
		members: getMembersAttendances(
			members,
			currentMonthSundays,
			previousMonthSundays,
			allAttendances,
			previousAttendances,
		),
		filterData: value,
	}
}

export type loaderData = typeof loaderFn

function getFilterOptions(
	params: z.infer<typeof paramsSchema>,
	tribe: Tribe,
): Prisma.UserWhereInput {
	const contains = `%${params.query.replace(/ /g, '%')}%`

	return {
		tribeId: tribe.id,
		id: { not: tribe.manager?.id },
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
		...getDateFilterOptions(params),
	}
}
