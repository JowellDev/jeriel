import { type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { querySchema } from '../../schema'
import { prisma } from '~/utils/db.server'
import { requireUser } from '~/utils/auth.server'
import { buildDepartmentWhere, DEPARTMENT_SELECT } from '../../utils/server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	invariant(currentUser.churchId, 'Church ID is required')

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const filterOption = submission.value

	const where = buildDepartmentWhere(filterOption.query, currentUser.churchId)

	const departments = await prisma.department.findMany({
		where,
		select: DEPARTMENT_SELECT,
		orderBy: { createdAt: 'desc' },
		take: filterOption.page * filterOption.take,
	})

	const total = await prisma.department.count({ where })

	return { departments, filterOption, total } as const
}

export type LoaderType = typeof loaderFn
