import { Role } from '@prisma/client'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	const data = await prisma.user.findMany({
		where: {
			churchId: currentUser.churchId,
			isActive: true,
			NOT: { roles: { equals: [Role.SUPER_ADMIN] } },
		},
		select: {
			id: true,
			name: true,
			phone: true,
			roles: true,
			isAdmin: true,
			departmentId: true,
		},
		orderBy: { name: 'asc' },
	})

	return json(data)
}

export type GetAllMembersApiData = typeof loader

export type MemberOption = { value: string; label: string }
