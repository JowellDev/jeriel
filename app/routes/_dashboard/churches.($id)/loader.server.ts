import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { querySchema } from './schema'
import type { Prisma } from '@prisma/client'
import { prisma } from '~/utils/db.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const { query } = submission.value
	const contains = `%${query.replace(/ /g, '%')}%`

	const where: Prisma.ChurchWhereInput = {
		OR: [
			{ name: { contains, mode: 'insensitive' } },
			{ user: { fullname: { contains, mode: 'insensitive' } } },
			{ user: { phone: { contains } } },
		],
	}

	const churches = await prisma.church.findMany({
		where,
		select: {
			id: true,
			name: true,
			user: { select: { fullname: true, phone: true } },
			isActive: true,
		},
		orderBy: { createdAt: 'desc' },
	})

	return json({ churches, query } as const)
}

export type LoaderType = typeof loaderFn
