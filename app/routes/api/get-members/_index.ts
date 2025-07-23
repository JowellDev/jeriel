import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	const url = new URL(request.url)
	const tribeId = url.searchParams.get('tribeId')

	const [unassignedMembers, tribeMembers] = await Promise.all([
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
		tribeId
			? prisma.user.findMany({
					where: {
						churchId: currentUser.churchId,
						isActive: true,
						tribeId,
					},
					select: {
						id: true,
						name: true,
						phone: true,
						roles: true,
						isAdmin: true,
					},
					orderBy: { name: 'asc' },
				})
			: [],
	])

	const members = [...unassignedMembers, ...tribeMembers]

	return {
		members: formatAsSelectFieldsData(members),
		admins: formatAsSelectFieldsData(members),
	}
}

function formatAsSelectFieldsData(
	data: { id: string; name?: string; phone?: string }[],
) {
	return data.map(data => ({ ...data, label: data.name, value: data.id }))
}
