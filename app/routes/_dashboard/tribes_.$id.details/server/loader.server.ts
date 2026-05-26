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
} from '~/helpers/attendance.server'
import { getMembersAttendances } from '~/shared/attendance'

function parseLoaderParams(request: Request) {
	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: paramsSchema })
	invariant(submission.status === 'success', 'invalid criteria')

	const { value } = submission
	const fromDate = parseISO(value.from)
	const toDate = parseISO(value.to)
	const dateRanges = prepareDateRanges(toDate)

	return { value, fromDate, toDate, dateRanges }
}

async function fetchTribePageData(
	tribe: Tribe & { id: string },
	where: Prisma.UserWhereInput,
	value: z.infer<typeof paramsSchema>,
) {
	const memberQuery = getMemberQuery(where, value)
	const [total, membersStats, tribeAssistants, membersCount] = await Promise.all([
		memberQuery[0],
		memberQuery[1],
		prisma.user.findMany({
			where: {
				tribeId: tribe.id,
				id: { not: (tribe as any).manager?.id },
				roles: { has: Role.TRIBE_MANAGER },
				NOT: { isActive: false, deletedAt: { not: null } },
			},
			include: { integrationDate: true },
		}),
		prisma.user.count({
			where: { tribeId: tribe.id, NOT: { isActive: false, deletedAt: { not: null } } },
		}),
	])
	return { total, membersStats, tribeAssistants, membersCount }
}

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	const { id } = params

	const { value, fromDate, dateRanges } = parseLoaderParams(request)

	const tribe = await prisma.tribe.findUnique({
		where: { id },
		include: { manager: true },
	})

	if (!tribe) throw new Response('Not Found', { status: 404 })

	currentUser.tribeId = tribe.id

	const where = getFilterOptions(formatOptions(value) as any, tribe as unknown as Tribe)
	const { total, membersStats, tribeAssistants, membersCount } = await fetchTribePageData(
		tribe as unknown as Tribe & { id: string },
		where,
		value,
	)

	const members = membersStats as Member[]
	const { allAttendances, previousAttendances } = await fetchAttendanceData(
		currentUser,
		members.map(m => m.id),
		fromDate,
		dateRanges.toDate,
		dateRanges.previousFrom,
		dateRanges.previousTo,
	)

	return {
		tribe: { id: tribe.id, name: tribe.name, manager: tribe.manager, createdAt: tribe.createdAt },
		total: total as number,
		tribeAssistants,
		membersCount,
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

export type loaderData = typeof loaderFn

function getFilterOptions(params: z.infer<typeof paramsSchema>, tribe: Tribe): Prisma.UserWhereInput {
	const contains = `%${params.query.replace(/ /g, '%')}%`
	return {
		tribeId: tribe.id,
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
		NOT: { isActive: false, deletedAt: { not: null } },
		...getDateFilterOptions(params),
	}
}
