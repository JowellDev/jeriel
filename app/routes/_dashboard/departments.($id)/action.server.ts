import { type ActionFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { getSubmissionData } from './validation.server'
import { type DepartmentFormData } from './model'
import { handleDepartment } from './handler.server'
import { getQueryFromParams } from '../../../utils/url'
import { getAllDepartments, getDataRows } from './utils/server'
import { createFile } from '../../../utils/xlsx.server'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const { id } = params
	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'EXPORT_DEP') {
		const query = getQueryFromParams(request)
		invariant(currentUser.churchId, 'Invalid churchId')

		const tribes = await getAllDepartments(query, currentUser.churchId)
		const safeRows = getDataRows(tribes)

		const fileLink = await createFile({
			safeRows,
			feature: 'departements',
			customerName: currentUser.name,
		})

		return {
			success: true,
			message: null,
			lastResult: null,
			error: null,
			fileLink,
		}
	}

	const submission = await getSubmissionData(formData, id)

	console.log('submission ===========>', submission)

	if (submission.status !== 'success') return submission.reply()

	invariant(currentUser.churchId, 'User must have a church')
	invariant(
		['create', 'update'].includes(`${intent}`),
		'Intent must be create or update',
	)

	const value = submission.value as DepartmentFormData

	try {
		await handleDepartment({
			data: value,
			churchId: currentUser.churchId,
			isCreate: intent === 'create',
			id,
		})

		return submission.reply()
	} catch (error: any) {
		console.log('Error handling department action: ===============>', error)
		return { ...submission.reply(), status: 'error', error: error.cause }
	}
}

export type ActionType = typeof actionFn
