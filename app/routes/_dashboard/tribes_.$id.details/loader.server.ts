import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { prisma } from '~/utils/db.server'
import type { MemberWithMonthlyAttendances, Tribe } from './types'
import { getcurrentMonthSundays } from '~/utils/date'
import { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { DEFAULT_QUERY_TAKE } from './constants'

export const querySchema = z.object({
	take: z.number().optional().default(DEFAULT_QUERY_TAKE),
	query: z
		.string()
		.optional()
		.transform(v => v ?? ''),
})

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	await requireUser(request)
	const { id } = params

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const { query, take } = submission.value

	const tribe = await prisma.tribe.findUnique({
		where: { id: id },
		include: { members: true, manager: true },
	})

	if (!tribe) {
		throw new Response('Not Found', { status: 404 })
	}

	const currentMonthSundays = getcurrentMonthSundays()

	const filteredMembers = tribe.members.filter(
		member =>
			member.name.toLowerCase().includes(query.toLowerCase()) ||
			member.phone.toLowerCase().includes(query.toLowerCase()),
	)

	const paginatedMembers = filteredMembers.slice(0, take)

	const membersWithAttendances = paginatedMembers.map(member => ({
		...member,
		lastMonthAttendanceResume: {
			attendance: Math.floor(Math.random() * 4),
			sundays: 4,
		},
		currentMonthAttendanceResume: {
			attendance: Math.floor(Math.random() * 4),
			sundays: 4,
		},
		currentMonthAttendances: currentMonthSundays.map(sunday => ({
			sunday,
			isPresent: Math.random() > 0.5,
		})),
	})) as unknown as MemberWithMonthlyAttendances[]

	const count = filteredMembers.length

	return json({
		tribe: {
			id: tribe.id,
			name: tribe.name,
			members: membersWithAttendances,
			manager: tribe.manager,
			createdAt: tribe.createdAt,
		} as Tribe,
		count,
		take,
	})
}

export type loaderData = typeof loaderFn
