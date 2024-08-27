import { json } from '@remix-run/node'
import { prisma } from '~/utils/db.server'

export const loader = async () => {
	const users = (
		await prisma.user.findMany({
			where: { isActive: true, honorFamilyId: null },
			select: { id: true, name: true, phone: true },
			orderBy: { name: 'asc' },
		})
	).map(({ id, name, phone }) => ({ label: name ?? phone, value: id }))

	const admins = (
		await prisma.user.findMany({
			where: { isActive: true, honorFamilyAdmin: null },
			select: { id: true, name: true, phone: true, honorFamilyAdmin: true },
			orderBy: { name: 'asc' },
		})
	).map(({ id, name, phone }) => ({ label: name ?? phone, value: id }))

	return json({ users, admins })
}
