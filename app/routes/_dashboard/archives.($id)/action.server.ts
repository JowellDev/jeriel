import { type ActionFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { archiveUserSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import { prisma } from '~/infrastructures/database/prisma.server'
import { notifyRequesterAboutArchiveAction } from '~/helpers/notification.server'
import { ArchiveRequestStatus } from '~/shared/enum'

export function getSubmissionData(formData: FormData, userId?: string) {
	const schema = userId ? archiveUserSchema.partial() : archiveUserSchema
	return parseWithZod(formData, {
		schema: schema,
		async: true,
	})
}

async function archivateUsers(
	usersToArchive: string[],
	requesterId: string | undefined,
	currentUserId: string,
) {
	await prisma.user.updateMany({
		where: { id: { in: usersToArchive } },
		data: { deletedAt: new Date(), isActive: false },
	})
	await markPendingRequestsCompleted(usersToArchive)
	if (requesterId) {
		await notifyRequesterAboutArchiveAction(
			usersToArchive,
			requesterId,
			'archivate',
			currentUserId,
		)
	}
}

async function markPendingRequestsCompleted(archivedUserIds: string[]) {
	const pendingRequests = await prisma.archiveRequest.findMany({
		where: {
			status: ArchiveRequestStatus.PENDING,
			usersToArchive: { some: { id: { in: archivedUserIds } } },
		},
		select: { id: true, usersToArchive: { select: { deletedAt: true } } },
	})
	const completedIds = pendingRequests
		.filter(request => request.usersToArchive.every(user => user.deletedAt))
		.map(request => request.id)
	if (completedIds.length === 0) return
	await prisma.archiveRequest.updateMany({
		where: { id: { in: completedIds } },
		data: { status: ArchiveRequestStatus.COMPLETED },
	})
}

async function rejectArchiveRequest(requestId: string, currentUserId: string) {
	const archiveRequest = await prisma.archiveRequest.update({
		where: { id: requestId },
		data: { status: ArchiveRequestStatus.REJECTED },
		select: {
			requesterId: true,
			usersToArchive: { select: { id: true } },
		},
	})
	await notifyRequesterAboutArchiveAction(
		archiveRequest.usersToArchive.map(user => user.id),
		archiveRequest.requesterId,
		'reject',
		currentUserId,
	)
}

async function findArchiveRequesterId(userId: string) {
	const archiveRequest = await prisma.archiveRequest.findFirst({
		where: { usersToArchive: { some: { id: userId } } },
		select: { requesterId: true },
	})
	return archiveRequest?.requesterId ?? ''
}

async function unarchivateUser(id: string, currentUserId: string) {
	const requesterToNotify = await findArchiveRequesterId(id)
	await prisma.user.updateMany({
		where: { id },
		data: { deletedAt: null, isActive: true },
	})
	await notifyRequesterAboutArchiveAction(
		[id],
		requesterToNotify,
		'unarchivate',
		currentUserId,
	)
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const { id } = params
	const formData = await request.formData()
	const intent = formData.get('intent')
	invariant(currentUser.churchId, 'User must have a church')
	if (intent === 'reject') {
		invariant(id, 'Archive request id is required')
		await rejectArchiveRequest(id, currentUser.id)
		return {
			lastResult: null,
			success: true,
			message: 'Demande rejetée avec succès.',
		}
	}
	const submission = await getSubmissionData(formData, id)
	if (submission.status !== 'success')
		return { lastResult: submission.reply(), success: false, message: null }
	invariant(
		intent === 'archivate' || intent === 'unarchivate',
		'Intent must be either "request" or "archivate"',
	)
	const { usersToArchive, requesterId } = submission.value
	if (intent === 'archivate' && usersToArchive) {
		await archivateUsers(usersToArchive, requesterId, currentUser.id)
		if (requesterId)
			return {
				lastResult: submission.reply(),
				success: true,
				message: 'Archivage effectué avec succès.',
			}
	}
	if (intent === 'unarchivate' && id) {
		await unarchivateUser(id, currentUser.id)
		return {
			lastResult: submission.reply(),
			success: true,
			message: 'Désarchivage effectué avec succès.',
		}
	}
	return { lastResult: submission.reply(), success: true, message: null }
}

export type ActionType = typeof actionFn
