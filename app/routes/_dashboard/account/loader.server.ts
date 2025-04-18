import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

const select = { select: { name: true } }

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	const user = await prisma.user.findUnique({
		where: { id: currentUser.id },
		select: {
			id: true,
			name: true,
			phone: true,
			roles: true,
			tribe: select,
			department: select,
			honorFamily: select,
			church: select,
		},
	})

	if (!user) return

	return { user }
}

export type LoaderType = typeof loaderFn
