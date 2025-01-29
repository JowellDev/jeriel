import { json, type ActionFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { archiveUserSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import { prisma } from '../../../utils/db.server'

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
		return json(submission.reply(), { status: 400 })
	}

	invariant(currentUser.churchId, 'User must have a church')
	invariant(
		intent === 'archivate' || intent === 'unarchivate',
		'Intent must be either "request" or "archivate"',
	)

	const { usersToArchive } = submission.value

	if (intent === 'archivate') {
		await prisma.user.updateMany({
			where: { id: { in: usersToArchive } },
			data: { deletedAt: new Date(), isActive: false },
		})
	}

	if (intent === 'unarchivate' && id) {
		await prisma.user.updateMany({
			where: { id },
			data: { deletedAt: null, isActive: true },
		})
	}

	return json(submission.reply(), { status: 200 })
}

export type ActionType = typeof actionFn
