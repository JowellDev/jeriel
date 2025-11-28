import { type LoaderFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import invariant from 'tiny-invariant'
import { prisma } from '~/infrastructures/database/prisma.server'
import { parseWithZod } from '@conform-to/zod'
import { filterSchema } from './schema'
import { type Prisma } from '@prisma/client'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	const { churchId } = currentUser
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	if (submission.status !== 'success') {
		return invariant(true, 'params must be defined')
	}

	invariant(churchId, 'Church ID is required')

	const filterOption = submission.value

	const contains = `%${filterOption.query.replace(/ /g, '%')}%`

	const baseWhere: Prisma.NotificationWhereInput = {
		userId: currentUser.id,
		OR: [{ title: { contains, mode: 'insensitive' } }],
	}

	const where: Prisma.NotificationWhereInput =
		filterOption.filter === 'unread'
			? { ...baseWhere, readAt: null }
			: baseWhere

	const notifications = await prisma.notification.findMany({
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
	})

	const total = await prisma.notification.count({ where })

	return {
		currentUser,
		notifications,
		filterData: { total, ...filterOption },
	}
}

export type LoaderType = typeof loaderFn
