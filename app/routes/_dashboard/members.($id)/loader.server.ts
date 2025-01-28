import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import type { Member } from '~/models/member.model'
import { filterSchema } from './schema'
import { getFilterOptions, getMembersAttendances } from './utils/server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const { value } = submission

	const where = getFilterOptions(value, currentUser)

	const members = (await prisma.user.findMany({
		where,
		select: {
			id: true,
			name: true,
			phone: true,
			location: true,
			createdAt: true,
		},
		orderBy: { createdAt: 'desc' },
		take: value.page * value.take,
	})) as Member[]

	const total = await prisma.user.count({ where })

	return json({
		total,
		members: getMembersAttendances(members),
		filterData: value,
	})
}

export type LoaderType = typeof loaderFn
