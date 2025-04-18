import { parseWithZod } from '@conform-to/zod'
import { redirect, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { querySchema } from './schema'
import invariant from 'tiny-invariant'
import { buildHonorFamilyWhere } from './utils/server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const { churchId, roles, ...user } = await requireUser(request)

	const shouldRedirectInDetails =
		!roles.includes('ADMIN') &&
		!roles.includes('SUPER_ADMIN') &&
		roles.includes('HONOR_FAMILY_MANAGER')

	if (shouldRedirectInDetails)
		return redirect(`/honor-families/${user.honorFamilyId}/details`)

	invariant(churchId, 'Church ID is required')

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const { query, take } = submission.value

	const where = buildHonorFamilyWhere(query, churchId)

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

	const total = await prisma.honorFamily.count({ where })

	return { honorFamilies, query, take, total }
}

export type loaderData = typeof loaderFn
