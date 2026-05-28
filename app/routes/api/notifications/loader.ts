import { type Prisma } from '@prisma/client'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'

const loader = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	const where: Prisma.NotificationWhereInput = {
		userId: currentUser.id,
		user: { churchId: currentUser.churchId },
		readAt: null,
	}

	const [notifications, unread, unseen] = await Promise.all([
		prisma.notification.findMany({
			where,
			take: 30,
			orderBy: { createdAt: 'desc' },
		}),
		prisma.notification.count({ where }),
		prisma.notification.count({ where: { ...where, seen: false } }),
	])

	return { notifications, unread, unseen }
}

export default loader
export type Loader = typeof loader
