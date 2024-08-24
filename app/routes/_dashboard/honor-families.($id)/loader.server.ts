import { parseWithZod } from '@conform-to/zod'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma, Prisma } from '~/utils/db.server'
import { querySchema } from './schema'
import invariant from 'tiny-invariant'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	await requireUser(request)

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const { query } = submission.value
	const contains = `%${query.replace(/ /g, '%')}%`

	const where: Prisma.HonorFamilyWhereInput = {
		OR: [
			{ name: { contains, mode: 'insensitive' } },
			{ admin: { name: { contains, mode: 'insensitive' } } },
			{ admin: { phone: { contains } } },
		],
	}

	const honorFamilies = await prisma.honorFamily.findMany({
		where,
		select: {
			name: true,
			createdAt: true,
			members: { select: { id: true } },
			admin: { select: { name: true, phone: true } },
		},
	})

	return json({ honorFamilies, query })
}

export type loaderData = typeof loaderFn
