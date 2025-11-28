import { type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { querySchema } from './schema'
import type { Prisma } from '@prisma/client'
import { prisma } from '~/infrastructures/database/prisma.server'
import { requireUser } from '~/utils/auth.server'
import { getAuthorizedEntities } from '../dashboard/utils.server'

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
		requesterId: currentUser.id,
		OR: [{ origin: { contains, mode: 'insensitive' } }],
	}

	const archiveRequests = await prisma.archiveRequest.findMany({
		where,
		select: {
			id: true,
			origin: true,
			status: true,
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

	const authorizedEntities = await getAuthorizedEntities(currentUser)

	const total = await prisma.archiveRequest.count({ where })

	return {
		archiveRequests,
		filterOption,
		total,
		currentUser,
		authorizedEntities,
	} as const
}

export type LoaderType = typeof loaderFn
