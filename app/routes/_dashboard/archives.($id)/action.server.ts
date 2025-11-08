import { type ActionFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { archiveUserSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import { prisma } from '../../../utils/db.server'
import { notifyRequesterAboutArchiveAction } from '~/utils/notification.util'

export function getSubmissionData(formData: FormData, userId?: string) {
	const schema = userId ? archiveUserSchema.partial() : archiveUserSchema
	return parseWithZod(formData, {
		schema: schema,
		async: true,
	})
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)

	const { id } = params

	const formData = await request.formData()
	const intent = formData.get('intent')

	const submission = await getSubmissionData(formData, id)

	if (submission.status !== 'success') {
		return {
			lastResult: submission.reply(),
			success: false,
			message: null,
		}
	}

	invariant(currentUser.churchId, 'User must have a church')
	invariant(
		intent === 'archivate' || intent === 'unarchivate',
		'Intent must be either "request" or "archivate"',
	)

	const { usersToArchive, requesterId } = submission.value

	if (intent === 'archivate') {
		await prisma.user.updateMany({
			where: { id: { in: usersToArchive } },
			data: { deletedAt: new Date(), isActive: false },
		})

		if (requesterId && usersToArchive) {
			await notifyRequesterAboutArchiveAction(
				usersToArchive,
				requesterId,
				'archivate',
				currentUser.id,
			)

			return {
				lastResult: submission.reply(),
				success: true,
				message: 'Archivage effectué avec succès.',
			}
		}
	}

	if (intent === 'unarchivate' && id) {
		let requesterToNotify = ''
		const archiveRequest = await prisma.archiveRequest.findFirst({
			where: {
				usersToArchive: {
					some: {
						id,
					},
				},
			},
			select: {
				requesterId: true,
			},
		})

		if (archiveRequest) {
			requesterToNotify = archiveRequest.requesterId
		}

		await prisma.user.updateMany({
			where: { id },
			data: { deletedAt: null, isActive: true },
		})

		await notifyRequesterAboutArchiveAction(
			[id],
			requesterToNotify,
			'unarchivate',
			currentUser.id,
		)

		return {
			lastResult: submission.reply(),
			success: true,
			message: 'Désarchivage effectué avec succès.',
		}
	}

	return {
		lastResult: submission.reply(),
		success: true,
		message: null,
	}
}

export type ActionType = typeof actionFn
