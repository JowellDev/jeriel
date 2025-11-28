import { type ActionFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'

export const action = async ({ request }: ActionFunctionArgs) => {
	const user = await requireUser(request)

	await prisma.notification.updateMany({
		where: {
			user: { id: user.id },
		},
		data: {
			seen: true,
		},
	})

	return { status: 'success' } as const
}

export default action
export type Action = typeof action
