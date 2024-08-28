import { Role } from '@prisma/client'
import { json, LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const admins = (
		await prisma.user.findMany({
			where: {
				isActive: true,
				honorFamilyId: null,
				churchId: currentUser.churchId,
				isAdmin: { not: true },
			},
			select: { id: true, name: true, honorFamilyManager: true },
			orderBy: { name: 'asc' },
		})
	).map(({ id, name }) => ({ label: name, value: id }))

	const users = (
		await prisma.user.findMany({
			where: {
				isActive: true,
				honorFamilyId: null,
				churchId: currentUser.churchId,
				honorFamilyManager: { is: null },
				isAdmin: { not: true },
			},
			select: { id: true, name: true },
			orderBy: { name: 'asc' },
		})
	).map(({ id, name }) => ({ label: name, value: id }))

	return json({ users, admins })
}
