import { json } from '@remix-run/node'
import { prisma } from '~/utils/db.server'

export const loader = async () => {
	const churchs = (
		await prisma.church.findMany({
			where: { isActive: true },
			select: { id: true, name: true },
			orderBy: { name: 'asc' },
		})
	).map(({ id, name }) => ({ label: name, value: id }))
	const users = (
		await prisma.user.findMany({
			where: { isActive: true },
			select: { id: true, name: true, phone: true },
			orderBy: { name: 'asc' },
		})
	).map(({ id, name, phone }) => ({ label: name ?? phone, value: id }))

	return json({ churchs, users })
}
