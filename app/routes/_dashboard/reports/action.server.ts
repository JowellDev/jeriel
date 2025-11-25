import { type ActionFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { archiveUserSchema } from './schema'
import { parseWithZod } from '@conform-to/zod'
import { prisma } from '../../../utils/db.server'

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
	invariant(intent === 'archivate', 'Intent must be archivate')

	const { usersToArchive } = submission.value

	await prisma.user.updateMany({
		where: { id: { in: usersToArchive } },
		data: { deletedAt: new Date() },
	})

	return { status: 'success' }
}

export type ActionType = typeof actionFn
