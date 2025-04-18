import { Role } from '@prisma/client'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const [admins, members] = await Promise.all([
		await prisma.user.findMany({
			where: {
				isActive: true,
				honorFamilyId: null,
				churchId: currentUser.churchId,
				NOT: {
					roles: { hasSome: [Role.SUPER_ADMIN, Role.HONOR_FAMILY_MANAGER] },
				},
			},
			select: { id: true, name: true, phone: true, isAdmin: true },
			orderBy: { name: 'asc' },
		}),
		await prisma.user.findMany({
			where: {
				isActive: true,
				honorFamilyId: null,
				churchId: currentUser.churchId,
				NOT: {
					roles: { hasSome: [Role.SUPER_ADMIN, Role.HONOR_FAMILY_MANAGER] },
				},
			},
			select: { id: true, name: true, phone: true },
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
