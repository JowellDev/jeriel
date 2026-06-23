import { type LoaderFunctionArgs } from '@remix-run/node'
import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { querySchema } from './schema'
import type { Prisma } from '@prisma/client'
import { prisma } from '~/infrastructures/database/prisma.server'
import { requireUser } from '~/utils/auth.server'

function buildArchiveWhere(
	churchId: string,
	contains: string,
): Prisma.ArchiveRequestWhereInput {
	return {
		churchId,
		OR: [
			{ origin: { contains, mode: 'insensitive' } },
			{ requester: { name: { contains, mode: 'insensitive' } } },
			{ requester: { phone: { contains } } },
		],
	}
}

function buildArchivedUserWhere(
	churchId: string,
	contains: string,
): Prisma.UserWhereInput {
	return {
		churchId,
		isActive: false,
		OR: [
			{ name: { contains, mode: 'insensitive' }, isActive: false },
			{ phone: { contains }, isActive: false },
		],
	}
}

async function fetchArchivePageData(
	where: Prisma.ArchiveRequestWhereInput,
	userWhere: Prisma.UserWhereInput,
	take: number,
) {
	return Promise.all([
		prisma.archiveRequest.findMany({
			where,
			select: {
				id: true,
				origin: true,
				status: true,
				createdAt: true,
				requester: {
					select: { id: true, name: true, phone: true, isAdmin: true },
				},
				usersToArchive: {
					select: {
						name: true,
						phone: true,
						id: true,
						deletedAt: true,
						pictureUrl: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
			take,
		}),
		prisma.user.findMany({
			where: userWhere,
			select: {
				id: true,
				phone: true,
				name: true,
				deletedAt: true,
				pictureUrl: true,
			},
			orderBy: { deletedAt: 'desc' },
			take,
		}),
		prisma.archiveRequest.count({ where }),
		prisma.user.count({ where: userWhere }),
	])
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
	const where = buildArchiveWhere(currentUser.churchId, contains)
	const userWhere = buildArchivedUserWhere(currentUser.churchId, contains)
	const [archiveRequests, archivedUsers, total, totalArchivedUsers] =
		await fetchArchivePageData(
			where,
			userWhere,
			filterOption.page * filterOption.take,
		)
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
