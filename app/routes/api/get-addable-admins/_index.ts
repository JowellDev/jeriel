import { type LoaderFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { Role } from '@prisma/client'
import { requireRole } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireRole(request, [Role.ADMIN])

	invariant(currentUser.churchId, 'Church ID is required')

	const members = await prisma.user.findMany({
		where: {
			churchId: currentUser.churchId,
			isActive: true,
			NOT: {
				roles: { has: Role.ADMIN },
			},
		},
		select: {
			id: true,
			name: true,
			email: true,
			isAdmin: true,
			password: {
				select: { hash: true },
			},
		},
		orderBy: { name: 'asc' },
	})

	return members
}

export type GetAddableAdminsLoaderData = Awaited<ReturnType<typeof loader>>
