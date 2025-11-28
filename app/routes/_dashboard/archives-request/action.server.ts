import type { ActionFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { archiveUserSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import { prisma } from '~/infrastructures/database/prisma.server'
import { notifyAdminAboutArchiveRequest } from '~/helpers/notification.server'

export function getSubmissionData(formData: FormData) {
	return parseWithZod(formData, {
		schema: archiveUserSchema,
		async: true,
	})
}

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)

	const formData = await request.formData()
	const intent = formData.get('intent')

	const submission = await getSubmissionData(formData)

	if (submission.status !== 'success') return submission.reply()

	invariant(currentUser.churchId, 'User must have a church')
	invariant(
		intent === 'archivate' || intent === 'request',
		'Intent must be either "request" or "archivate"',
	)

	const { usersToArchive, origin } = submission.value

	if (intent === 'request') {
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
	}

	return { status: 'success' }
}

export type ActionType = typeof actionFn
