import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import invariant from 'tiny-invariant'
import { prisma } from '~/utils/db.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const { churchId } = currentUser

	invariant(churchId, 'Church ID is required')

	const notifications = await prisma.notification.findMany({
		where: { userId: currentUser.id },
		select: {
			id: true,
			title: true,
			content: true,
			url: true,
			seen: true,
			readAt: true,
			createdAt: true,
			user: { select: { id: true, name: true } },
		},
	})

	console.log('notifications============', notifications)

	return json({ currentUser, notifications })
}

export type LoaderType = typeof loaderFn
