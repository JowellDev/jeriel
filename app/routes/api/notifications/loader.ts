import { type Prisma } from '@prisma/client'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { requireUserId } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

const loader = async ({ request }: LoaderFunctionArgs) => {
	const userId = await requireUserId(request)

	const where: Prisma.NotificationWhereInput = {
		userId: userId,
		readAt: null,
	}

	const notifications = await prisma.notification.findMany({
		where,
		take: 30,
		orderBy: {
			createdAt: 'desc',
		},
	})

	const unread = await prisma.notification.count({
		where,
	})

	const unseen = await prisma.notification.count({
		where: {
			seen: false,
			...where,
		},
	})

	return json({ notifications, unread, unseen })
}

export default loader
export type Loader = typeof loader
