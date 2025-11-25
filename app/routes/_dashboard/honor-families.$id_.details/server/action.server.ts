import { addAssistantSchema, uploadMemberSchema } from '../schema'
import { type ActionFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import { FORM_INTENT } from '../constants'
import invariant from 'tiny-invariant'
import {
	createMember as createHonorFamilyMember,
	uploadHonorFamilyMembers,
	addAssistantToHonorFamily,
	createExportHonorFamilyMembersFile,
	getExportHonorFamilyMembers,
	getHonorFamilyName,
	getUrlParams,
	validateCreateMemberPayload,
} from '../utils/utils.server'
import type { ExportMembersPayload } from '../types'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)

	const { id: honorFamilyId } = params

	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(honorFamilyId, 'honorFamilyId is required')

	if (intent === FORM_INTENT.UPLOAD) {
		const submission = await parseWithZod(formData, {
			schema: uploadMemberSchema,
			async: true,
		})

		if (submission.status !== 'success') return submission.reply()

		const { file } = submission.value

		try {
			await uploadHonorFamilyMembers(
				file as File,
				currentUser.churchId,
				honorFamilyId,
			)

			return { status: 'success' }
		} catch (error: any) {
			return { ...submission.reply(), status: 'error', error: error.cause }
		}
	}

	if (intent === FORM_INTENT.ADD_ASSISTANT) {
		const submission = await parseWithZod(formData, {
			schema: addAssistantSchema,
			async: true,
		})

		if (submission.status !== 'success') return submission.reply()

		const { value } = submission

		await addAssistantToHonorFamily(value, honorFamilyId)

		return { status: 'success' }
	}

	if (intent === FORM_INTENT.EXPORT) {
		return exportMembers({
			request,
			honorFamilyId,
			customerName: currentUser.name,
		})
	}

	if (intent === FORM_INTENT.CREATE) {
		return createMember(formData, currentUser.churchId, honorFamilyId)
	}

	return { status: 'success' }
}

async function exportMembers({
	request,
	customerName,
	honorFamilyId,
}: ExportMembersPayload) {
	const filterData = getUrlParams(request)

	const honorFamily = await getHonorFamilyName(honorFamilyId)

	const members = await getExportHonorFamilyMembers({
		id: honorFamilyId,
		filterData,
	})

	const fileName = `Membres de la famille d'Honneur ${honorFamily?.name}`

	const fileLink = await createExportHonorFamilyMembersFile({
		fileName,
		members,
		customerName,
	})

	return { status: 'success', fileLink }
}

async function createMember(
	formData: FormData,
	churchId: string,
	honorFamilyId: string,
) {
	const submission = await validateCreateMemberPayload(formData)

	if (submission.status !== 'success') return submission.reply()

	await createHonorFamilyMember({
		...submission.value,
		churchId,
		honorFamilyId,
	})

	return { status: 'success' }
}

export type ActionType = typeof actionFn
