import { type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { querySchema } from './schema'
import type { Prisma } from '@prisma/client'
import { prisma } from '~/utils/db.server'
import { requireUser } from '~/utils/auth.server'

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)

	invariant(currentUser.churchId, 'Church ID is required')

	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: querySchema })

	invariant(submission.status === 'success', 'invalid criteria')

	const filterOption = submission.value

	const contains = `%${filterOption.query.replace(/ /g, '%')}%`

	const where: Prisma.ArchiveRequestWhereInput = {
		churchId: currentUser.churchId,
		OR: [
			{ origin: { contains, mode: 'insensitive' } },
			{ requester: { name: { contains, mode: 'insensitive' } } },
			{ requester: { phone: { contains } } },
		],
	}

	const userWhere: Prisma.UserWhereInput = {
		churchId: currentUser.churchId,
		isActive: false,
		OR: [
			{ name: { contains, mode: 'insensitive' }, isActive: false },
			{ phone: { contains }, isActive: false },
		],
	}

	const archiveRequests = await prisma.archiveRequest.findMany({
		where,
		select: {
			id: true,
			origin: true,
			requester: {
				select: { id: true, name: true, phone: true, isAdmin: true },
			},
			usersToArchive: {
				select: { name: true, phone: true, id: true, deletedAt: true },
			},
			createdAt: true,
		},
		orderBy: { createdAt: 'desc' },
		take: filterOption.page * filterOption.take,
	})

	const archivedUsers = await prisma.user.findMany({
		where: userWhere,
		select: {
			id: true,
			phone: true,
			name: true,
			deletedAt: true,
		},
		orderBy: { deletedAt: 'desc' },
		take: filterOption.page * filterOption.take,
	})

	const total = await prisma.archiveRequest.count({ where })
	const totalArchivedUsers = await prisma.user.count({ where: userWhere })

	return {
		archiveRequests,
		filterOption,
		total,
		archivedUsers,
		totalArchivedUsers,
		currentUser,
	} as const
}

export type LoaderType = typeof loaderFn
