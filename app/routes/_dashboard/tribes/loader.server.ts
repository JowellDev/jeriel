import { parseWithZod } from '@conform-to/zod'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { querySchema } from './schema'
import invariant from 'tiny-invariant'
import type { Prisma } from '@prisma/client'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const { query } = submission.value
	const contains = `%${query.replace(/ /g, '%')}%`

	const where: Prisma.TribeWhereInput = {
		churchId: currentUser.churchId!,
		OR: [
			{ name: { contains, mode: 'insensitive' } },
			{ manager: { name: { contains, mode: 'insensitive' } } },
			{ manager: { phone: { contains } } },
		],
	}

	const tribes = await prisma.tribe.findMany({
		where,
		select: {
			name: true,
			createdAt: true,
			members: {
				select: { id: true, name: true, phone: true, location: true },
			},
			manager: { select: { name: true, phone: true } },
		},
		orderBy: { name: 'asc' },
	})

	return json({ tribes, query })
}

export type loaderData = typeof loaderFn
