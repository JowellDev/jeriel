import { Role } from '@prisma/client'
import { type LoaderFunctionArgs } from '@remix-run/node'
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
				tribeId: null,
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

	return {
		members: formatAsSelectFieldsData(members),
		admins: formatAsSelectFieldsData(admins),
	}
}

function formatAsSelectFieldsData(
	data: { id: string; name?: string; phone?: string }[],
) {
	return data.map(data => ({ ...data, label: data.name, value: data.id }))
}
