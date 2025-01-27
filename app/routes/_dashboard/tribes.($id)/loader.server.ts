import { parseWithZod } from '@conform-to/zod'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { querySchema } from './schema'
import invariant from 'tiny-invariant'
import { buildTribesWhere } from './utils/server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	invariant(currentUser.churchId, 'Church ID is required')

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const filterOptions = submission.value

	const where = buildTribesWhere(filterOptions.query, currentUser.churchId)

	const tribes = await prisma.tribe.findMany({
		where,
		select: {
			id: true,
			name: true,
			createdAt: true,
			members: {
				select: { id: true, name: true, phone: true },
			},
			manager: { select: { id: true, name: true, phone: true, isAdmin: true } },
		},
		orderBy: { name: 'asc' },
		take: filterOptions.page * filterOptions.take,
	})

	const total = await prisma.tribe.count({ where })

	return json({ tribes, filterOptions, total } as const)
}

export type loaderData = typeof loaderFn
