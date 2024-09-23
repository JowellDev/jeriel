import { json, type ActionFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { getSubmissionData } from './validation.server'
import { type DepartmentFormData } from './model'
import { handleDepartment } from './handler.server'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const { id } = params
	const formData = await request.formData()
	const intent = formData.get('intent')

	const submission = await getSubmissionData(formData, id)

	console.log('submission ============>', submission)

	if (submission.status !== 'success') {
		return json(submission.reply(), { status: 400 })
	}

	invariant(currentUser.churchId, 'User must have a church')
	invariant(
		['create', 'update'].includes(`${intent}`),
		'Intent must be create or update',
	)

	const data = submission.value as DepartmentFormData

	try {
		await handleDepartment({
			data,
			churchId: currentUser.churchId,
			isCreate: intent === 'create',
			id,
		})
	} catch (error: any) {
		console.log(error, ' error')
		return json(
			{ ...submission.reply(), status: 'error', error: error.cause },
			{ status: 400 },
		)
	}

	return json(submission.reply(), { status: 200 })
}

export type ActionType = typeof actionFn
