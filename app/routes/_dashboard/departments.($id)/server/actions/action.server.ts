import { type ActionFunctionArgs } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { getSubmissionData } from '../../validation.server'
import { type DepartmentFormData } from '../../model'
import { handleDepartment } from './handler.server'
import { getQueryFromParams } from '~/utils/url'
import { getDepartmentsForExport } from '../../utils/server'
import { createDepartmentsExcelFile } from '~/utils/excel.server'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)

	const { id } = params

	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'EXPORT_DEP')
		return handleExportDepartments(request, currentUser)

	const submission = await getSubmissionData(formData, id)

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
		return { status: 'success' }
	} catch (error: unknown) {
		const message =
			error instanceof Error
				? error.message
				: 'Une erreur inattendue est survenue'
		return { ...submission.reply(), status: 'error', error: message }
	}
}

export type ActionType = typeof actionFn

async function handleExportDepartments(
	request: Request,
	currentUser: Awaited<ReturnType<typeof requireUser>>,
) {
	invariant(currentUser.churchId, 'Invalid churchId')

	const query = getQueryFromParams(request)
	const departments = await getDepartmentsForExport(query, currentUser.churchId)
	const fileLink = await createDepartmentsExcelFile(departments)

	return { status: 'success', fileLink }
}
