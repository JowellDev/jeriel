import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import invariant from 'tiny-invariant'
import { prisma } from '~/infrastructures/database/prisma.server'
import { parseWithZod } from '@conform-to/zod'
import { filterSchema } from './schema'
import { type Prisma } from '@prisma/client'

function buildNotificationWhere(
	userId: string,
	churchId: string,
	contains: string,
	filter: string,
): Prisma.NotificationWhereInput {
	const baseWhere: Prisma.NotificationWhereInput = {
		userId,
		user: { churchId },
		OR: [{ title: { contains, mode: 'insensitive' } }],
	}
	return filter === 'unread' ? { ...baseWhere, readAt: null } : baseWhere
}

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	invariant(currentUser.churchId, 'Church ID is required')
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')
	const filterOption = submission.value
	const contains = `%${filterOption.query.replace(/ /g, '%')}%`

	const where = buildNotificationWhere(
		currentUser.id,
		currentUser.churchId,
		contains,
		filterOption.filter,
	)

	const [notifications, total] = await Promise.all([
		prisma.notification.findMany({
			where,
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
			take: filterOption.page * filterOption.take,
			orderBy: { createdAt: 'desc' },
		}),
		prisma.notification.count({ where }),
	])
	return { currentUser, notifications, filterData: { total, ...filterOption } }
}

export type LoaderType = typeof loaderFn
