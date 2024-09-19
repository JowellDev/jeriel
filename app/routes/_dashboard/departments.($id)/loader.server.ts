import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { querySchema } from './schema'
import type { Prisma } from '@prisma/client'
import { prisma } from '~/utils/db.server'
import { requireUser } from '~/utils/auth.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	await requireUser(request)

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const filterOption = submission.value

	const contains = `%${filterOption.query.replace(/ /g, '%')}%`

	const where: Prisma.DepartmentWhereInput = {
		OR: [
			{ name: { contains, mode: 'insensitive' } },
			{ manager: { name: { contains, mode: 'insensitive' } } },
			{ manager: { phone: { contains } } },
		],
	}

	const departments = await prisma.department.findMany({
		where,
		select: {
			id: true,
			name: true,
			manager: { select: { name: true, phone: true } },
			members: { select: { name: true, phone: true, id: true } },
			createdAt: true,
		},
		orderBy: { createdAt: 'desc' },
		take: filterOption.page * filterOption.take,
	})

	const total = await prisma.department.count({ where })

	return json({ departments, filterOption, total } as const)
}

export type LoaderType = typeof loaderFn
