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

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)

	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(currentUser.churchId, 'User must have a church')

	if (intent === 'request') {
		const submission = await parseWithZod(formData, {
			schema: archiveUserSchema,
			async: true,
		})

		if (submission.status !== 'success') return submission.reply()

		const { usersToArchive, origin } = submission.value

		const archiveRequest = await prisma.archiveRequest.create({
			data: {
				origin,
				churchId: currentUser.churchId,
				requesterId: currentUser.id,
				usersToArchive: {
					connect: usersToArchive.map((userId: string) => ({ id: userId })),
				},
			},
		})

		await notifyAdminAboutArchiveRequest(archiveRequest.id, currentUser.id)

		return { status: 'success' }
	}

	if (intent === 'update') {
		const submission = await parseWithZod(formData, {
			schema: updateArchiveRequestSchema,
			async: true,
		})

		if (submission.status !== 'success') return submission.reply()

		const { requestId, usersToArchive } = submission.value

		await prisma.archiveRequest.update({
			where: { id: requestId, requesterId: currentUser.id },
			data: {
				usersToArchive: {
					set: usersToArchive.map((userId: string) => ({ id: userId })),
				},
			},
		})

		return { status: 'success' }
	}

	if (intent === 'delete') {
		const submission = parseWithZod(formData, {
			schema: deleteArchiveRequestSchema,
		})

		if (submission.status !== 'success') return submission.reply()

		const { requestId } = submission.value

		await prisma.archiveRequest.delete({
			where: { id: requestId, requesterId: currentUser.id },
		})

		return { status: 'success' }
	}

	throw new Response('Invalid intent', { status: 400 })
}

export type ActionType = typeof actionFn
