import { type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { Role } from '@prisma/client'
import { requireRole } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import { filterSchema } from '../schema'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireRole(request, [Role.ADMIN])

	invariant(currentUser.churchId, 'Church ID is required')

	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const { value } = submission
	const { query, take, page, status } = value

	const skip = (page - 1) * take
	const contains = `%${query.replace(/ /g, '%')}%`

	const where = {
		churchId: currentUser.churchId,
		roles: { has: Role.ADMIN },
		OR: [
			{ name: { contains, mode: 'insensitive' as const } },
			{ email: { contains, mode: 'insensitive' as const } },
		],
		...(status === 'active' && { isActive: true }),
		...(status === 'inactive' && { isActive: false }),
	}

	const [total, admins, church] = await Promise.all([
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
				church: {
					select: {
						id: true,
						name: true,
					},
				},
				tribe: {
					select: {
						id: true,
						name: true,
					},
				},
				department: {
					select: {
						id: true,
						name: true,
					},
				},
				honorFamily: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
			skip,
			take,
		}),
		prisma.church.findUnique({
			where: { id: currentUser.churchId },
			select: { adminId: true },
		}),
	])

	return {
		admins,
		total,
		filterData: value,
		currentUserId: currentUser.id,
		churchAdminId: church?.adminId,
	}
}

export type LoaderType = typeof loaderFn
