import { Role } from '@prisma/client'
import { json, LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const [admins, members] = await Promise.all([
		await prisma.user.findMany({
			where: {
				isActive: true,
				honorFamilyId: null,
				honorFamilyManager: null,
				churchId: currentUser.churchId,
			},
			select: { id: true, name: true, phone: true, isAdmin: true },
			orderBy: { name: 'asc' },
		}),
		await prisma.user.findMany({
			where: {
				isActive: true,
				isAdmin: false,
				honorFamilyId: null,
				honorFamilyManager: null,
				churchId: currentUser.churchId,
				NOT: { roles: { equals: [Role.ADMIN] } },
			},
			select: { id: true, name: true, phone: true },
			orderBy: { name: 'asc' },
		}),
	])

	return json({
		members: formatAsSelectData(members),
		admins: formatAsSelectData(admins),
	})
}

function formatAsSelectData(
	data: { id: string; name?: string; phone?: string }[],
) {
	return data.map(data => ({ ...data, label: data.name, value: data.id }))
}
