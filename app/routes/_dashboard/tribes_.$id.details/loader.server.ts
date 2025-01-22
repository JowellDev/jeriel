import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { prisma } from '~/utils/db.server'
import { getMonthSundays, normalizeDate } from '~/utils/date'
import type { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { Role, type Prisma } from '@prisma/client'
import type { Tribe } from './types'
import { paramsSchema } from './schema'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	await requireUser(request)
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

	const where = getFilterOptions(value, tribe as unknown as Tribe)

	const members = (await prisma.user.findMany({
		where,
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			createdAt: true,
			integrationDate: true,
		},
		orderBy: { createdAt: 'desc' },
		take: value.page * value.take,
	})) as Member[]

	const tribeAssistants = (await prisma.user.findMany({
		where: {
			tribeId: tribe.id,
			id: { not: tribe.manager.id },
			roles: { has: Role.TRIBE_MANAGER },
		},
		include: { integrationDate: true },
	})) as Member[]

	const total = await prisma.user.count({
		where,
	})
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
		members: getMembersAttendances(members),
		filterData: value,
	})
}

export type loaderData = typeof loaderFn

function getMembersAttendances(members: Member[]): MemberMonthlyAttendances[] {
	const currentMonthSundays = getMonthSundays(new Date())
	return members.map(member => ({
		...member,
		previousMonthAttendanceResume: null,
		currentMonthAttendanceResume: null,
		currentMonthAttendances: currentMonthSundays.map(sunday => ({
			sunday,
			isPresent: null,
		})),
	}))
}

function getFilterOptions(
	params: z.infer<typeof paramsSchema>,
	tribe: Tribe,
): Prisma.UserWhereInput {
	const { from, to } = params

	const contains = `%${params.query.replace(/ /g, '%')}%`
	const isPeriodDefined = from && to

	return {
		tribeId: tribe.id,
		id: { not: tribe.manager.id },
		...(isPeriodDefined && {
			createdAt: {
				gte: normalizeDate(new Date(from)),
				lt: normalizeDate(new Date(to), 'end'),
			},
		}),
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
	}
}
