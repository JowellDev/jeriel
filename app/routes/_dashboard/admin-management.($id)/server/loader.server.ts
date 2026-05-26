import { type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { Role, type Prisma } from '@prisma/client'
import { requireRole } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import { filterSchema } from '../schema'

function buildAdminListWhere(
	churchId: string,
	query: string,
	status: string | undefined,
): Prisma.UserWhereInput {
	const contains = `%${query.replace(/ /g, '%')}%`

	return {
		churchId,
		roles: { has: Role.ADMIN },
		OR: [
			{ name: { contains, mode: 'insensitive' } },
			{ email: { contains, mode: 'insensitive' } },
		],
		...(status === 'active' && { isActive: true }),
		...(status === 'inactive' && { isActive: false }),
		NOT: { isActive: false, deletedAt: { not: null } },
	}
}

async function fetchAdminListData(
	where: Prisma.UserWhereInput,
	take: number,
	skip: number,
	churchId: string,
) {
	return Promise.all([
		prisma.user.count({ where }),
		prisma.user.findMany({
			where,
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				location: true,
				isActive: true,
				roles: true,
				createdAt: true,
				church: { select: { id: true, name: true } },
				tribe: { select: { id: true, name: true } },
				department: { select: { id: true, name: true } },
				honorFamily: { select: { id: true, name: true } },
			},
			orderBy: { createdAt: 'desc' },
			skip,
			take,
		}),
		prisma.church.findUnique({
			where: { id: churchId },
			select: { adminId: true },
		}),
	])
}

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireRole(request, [Role.ADMIN])
	invariant(currentUser.churchId, 'Church ID is required')

	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const { value } = submission
	const { query, take, page, status } = value
	const where = buildAdminListWhere(currentUser.churchId, query, status)

	const [total, admins, church] = await fetchAdminListData(
		where,
		take,
		(page - 1) * take,
		currentUser.churchId,
	)

	return {
		admins,
		total,
		filterData: value,
		currentUserId: currentUser.id,
		churchAdminId: church?.adminId,
	}
}

export type LoaderType = typeof loaderFn
