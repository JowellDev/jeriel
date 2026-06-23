import type { ActionFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import {
	archiveUserSchema,
	deleteArchiveRequestSchema,
	updateArchiveRequestSchema,
} from './schema'
import { parseWithZod } from '@conform-to/zod'
import { prisma } from '~/infrastructures/database/prisma.server'
import { notifyAdminAboutArchiveRequest } from '~/helpers/notification.server'
import { ArchiveRequestStatus } from '~/shared/enum'

async function handleRequestIntent(
	formData: FormData,
	churchId: string,
	currentUserId: string,
) {
	const submission = await parseWithZod(formData, {
		schema: archiveUserSchema,
		async: true,
	})
	if (submission.status !== 'success') return submission.reply()
	const { usersToArchive, origin } = submission.value
	const archiveRequest = await prisma.archiveRequest.create({
		data: {
			origin,
			churchId,
			status: ArchiveRequestStatus.PENDING,
			requesterId: currentUserId,
			usersToArchive: {
				connect: usersToArchive.map((userId: string) => ({ id: userId })),
			},
		},
	})
	await notifyAdminAboutArchiveRequest(archiveRequest.id, currentUserId)
	return { status: 'success' }
}

async function handleUpdateIntent(formData: FormData, currentUserId: string) {
	const submission = await parseWithZod(formData, {
		schema: updateArchiveRequestSchema,
		async: true,
	})
	if (submission.status !== 'success') return submission.reply()
	const { requestId, usersToArchive } = submission.value
	await prisma.archiveRequest.update({
		where: { id: requestId, requesterId: currentUserId },
		data: {
			usersToArchive: {
				set: usersToArchive.map((userId: string) => ({ id: userId })),
			},
		},
	})
	return { status: 'success' }
}

async function handleDeleteIntent(formData: FormData, currentUserId: string) {
	const submission = parseWithZod(formData, {
		schema: deleteArchiveRequestSchema,
	})
	if (submission.status !== 'success') return submission.reply()
	await prisma.archiveRequest.delete({
		where: { id: submission.value.requestId, requesterId: currentUserId },
	})
	return { status: 'success' }
}

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')
	invariant(currentUser.churchId, 'User must have a church')
	if (intent === 'request')
		return handleRequestIntent(formData, currentUser.churchId, currentUser.id)
	if (intent === 'update') return handleUpdateIntent(formData, currentUser.id)
	if (intent === 'delete') return handleDeleteIntent(formData, currentUser.id)
	throw new Response('Invalid intent', { status: 400 })
}

export type ActionType = typeof actionFn
