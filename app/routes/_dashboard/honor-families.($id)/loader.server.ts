import { parseWithZod } from '@conform-to/zod'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { querySchema } from './schema'
import invariant from 'tiny-invariant'
import type { Prisma } from '@prisma/client'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const { churchId } = await requireUser(request)
	invariant(churchId, 'Church ID is required')

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const { query, take } = submission.value
	const contains = `%${query.replace(/ /g, '%')}%`

	const where = {
		churchId,
		OR: [
			{ name: { contains, mode: 'insensitive' } },
			{ manager: { name: { contains, mode: 'insensitive' } } },
			{ manager: { phone: { contains, mode: 'insensitive' } } },
		],
	} satisfies Prisma.HonorFamilyWhereInput

	const honorFamilies = await prisma.honorFamily.findMany({
		where,
		select: {
			id: true,
			name: true,
			createdAt: true,
			location: true,
			members: { select: { id: true, name: true } },
			manager: { select: { id: true, name: true, phone: true, isAdmin: true } },
		},
		orderBy: { name: 'asc' },
		take,
	})

	const count = await prisma.honorFamily.count({ where })

	return json({ honorFamilies, query, take, count })
}

export type loaderData = typeof loaderFn
