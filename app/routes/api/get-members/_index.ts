import { Role } from '@prisma/client'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	const [members, admins] = await Promise.all([
		prisma.user.findMany({
			where: {
				churchId: currentUser.churchId,
				isActive: true,
				tribeId: null,
				isAdmin: false,
			},
			select: { id: true, name: true, phone: true, roles: true, isAdmin: true },
			orderBy: { name: 'asc' },
		}),

		prisma.user.findMany({
			where: {
				churchId: currentUser.churchId,
				isActive: true,
				tribeManager: null,
				NOT: { roles: { equals: [Role.ADMIN] } },
			},
			select: {
				id: true,
				name: true,
				phone: true,
				roles: true,
				isAdmin: true,
			},
			orderBy: { name: 'asc' },
		}),
	])

	return json({ members, admins })
}
