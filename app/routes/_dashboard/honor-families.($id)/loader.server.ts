import { parseWithZod } from '@conform-to/zod'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { querySchema } from './schema'
import invariant from 'tiny-invariant'
import { Prisma } from '@prisma/client'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	await requireUser(request)

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const { query } = submission.value
	const contains = `%${query.replace(/ /g, '%')}%`

	const where = {
		OR: [
			{ name: { contains, mode: 'insensitive' } },
			{ manager: { name: { contains, mode: 'insensitive' } } },
			{ manager: { phone: { contains, mode: 'insensitive' } } },
		],
	} satisfies Prisma.HonorFamilyWhereInput

	const honorFamilies = await prisma.honorFamily.findMany({
		where,
		select: {
			name: true,
			createdAt: true,
			members: { select: { id: true } },
			manager: { select: { name: true, phone: true } },
		},
		orderBy: { name: 'asc' },
	})

	return json({ honorFamilies, query })
}

export type loaderData = typeof loaderFn
