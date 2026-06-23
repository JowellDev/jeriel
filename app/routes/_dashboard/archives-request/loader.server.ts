import { type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { querySchema } from './schema'
import type { Prisma } from '@prisma/client'
import { prisma } from '~/infrastructures/database/prisma.server'
import { requireUser } from '~/utils/auth.server'
import { getAuthorizedEntities } from '../dashboard/utils.server'

function buildArchiveRequestWhere(
	churchId: string,
	requesterId: string,
	contains: string,
): Prisma.ArchiveRequestWhereInput {
	return { churchId, requesterId, origin: { contains, mode: 'insensitive' } }
}

export const loaderFn = async ({ request }: LoaderFunctionArgs) => {
	const currentUser = await requireUser(request)
	invariant(currentUser.churchId, 'Church ID is required')
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: querySchema,
	})
	invariant(submission.status === 'success', 'invalid criteria')
	const filterOption = submission.value
	const contains = `%${filterOption.query.replace(/ /g, '%')}%`
	const where = buildArchiveRequestWhere(
		currentUser.churchId,
		currentUser.id,
		contains,
	)
	const [archiveRequests, authorizedEntities, total] = await Promise.all([
		prisma.archiveRequest.findMany({
			where,
			select: {
				id: true,
				origin: true,
				status: true,
				comment: true,
				createdAt: true,
				requester: {
					select: { id: true, name: true, phone: true, isAdmin: true },
				},
				usersToArchive: {
					select: { name: true, phone: true, id: true, deletedAt: true },
				},
			},
			orderBy: { createdAt: 'desc' },
			take: filterOption.page * filterOption.take,
		}),
		getAuthorizedEntities(currentUser),
		prisma.archiveRequest.count({ where }),
	])
	return {
		archiveRequests,
		filterOption,
		total,
		currentUser,
		authorizedEntities,
	} as const
}

export type LoaderType = typeof loaderFn
