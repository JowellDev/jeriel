import { type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { querySchema } from './schema'
import type { Prisma } from '@prisma/client'
import { prisma } from '~/infrastructures/database/prisma.server'

function parseChurchQuery(request: Request) {
	const url = new URL(request.url)

	const submission = parseWithZod(url.searchParams, { schema: querySchema })
	invariant(submission.status === 'success', 'invalid criteria')

	return submission.value
}

function buildChurchWhere(query: string): Prisma.ChurchWhereInput {
	const contains = `%${query.replace(/ /g, '%')}%`

	return {
		OR: [
			{ name: { contains, mode: 'insensitive' } },
			{ admin: { name: { contains, mode: 'insensitive' } } },
			{ admin: { phone: { contains } } },
		],
	}
}

function fetchChurches(where: Prisma.ChurchWhereInput) {
	return prisma.church.findMany({
		where,
		select: {
			id: true,
			name: true,
			admin: { select: { name: true, email: true, phone: true } },
			isActive: true,
			smsEnabled: true,
		},
		orderBy: { createdAt: 'desc' },
	})
}

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const { query } = parseChurchQuery(request)

	const churches = await fetchChurches(buildChurchWhere(query))

	return { churches, query } as const
}

export type LoaderType = typeof loaderFn
