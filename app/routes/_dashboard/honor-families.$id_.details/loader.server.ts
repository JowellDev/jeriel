import { json, redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import { requireUser } from '~/utils/auth.server'
import { getMonthSundays } from '~/utils/date'
import { prisma } from '~/utils/db.server'
import { querySchema } from './schema'
import invariant from 'tiny-invariant'
import type { Prisma } from '@prisma/client'

export const loaderFn = async ({ request, params }: LoaderFunctionArgs) => {
	await requireUser(request)

	const { id } = params

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const { query, take } = submission.value
	const contains = `%${query.replace(/ /g, '%')}%`

	const where = {
		OR: [{ isActive: true, name: { contains }, phone: { contains } }],
	} satisfies Prisma.UserWhereInput

	const honorFamily = await prisma.honorFamily.findUnique({
		where: { id: id },
		select: {
			id: true,
			name: true,
			_count: { select: { members: true } },
			manager: { select: { id: true, name: true } },
			members: {
				where,
				select: { id: true, name: true, phone: true, createdAt: true },
				take,
			},
		},
	})

	if (!honorFamily) {
		return redirect('/honor-families')
	}

	const currentMonthSundays = getMonthSundays(new Date())

	const membersWithAttendances = honorFamily.members.map(member => ({
		...member,
		lastMonthAttendanceResume: {
			attendance: Math.floor(Math.random() * 4),
			sundays: 4,
		},
		currentMonthAttendanceResume: {
			attendance: Math.floor(Math.random() * 4),
			sundays: 4,
		},
		currentMonthAttendances: currentMonthSundays.map((sunday: any) => ({
			sunday,
			isPresent: Math.random() > 0.5,
		})),
	}))

	return json({
		honorFamily: { ...honorFamily, members: membersWithAttendances },
		query,
		take,
	})
}

export type LoaderData = typeof loaderFn
