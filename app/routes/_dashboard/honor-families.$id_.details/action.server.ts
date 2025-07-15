import { addAssistantSchema, uploadMemberSchema } from './schema'
import { data, type ActionFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import { FORM_INTENT } from './constants'
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
} from './utils/utils.server'
import type { ExportMembersPayload } from './types'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)

	const { id: honorFamilyId } = params

	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(honorFamilyId, 'honorFamilyId is required')

	if (intent === FORM_INTENT.EXPORT) {
		return await exportMembers({
			request,
			honorFamilyId,
			customerName: currentUser.name,
		})
	}

	if (intent === FORM_INTENT.CREATE) {
		return await createMember(formData, currentUser.churchId, honorFamilyId)
	}

	if (intent === FORM_INTENT.UPLOAD) {
		const submission = await parseWithZod(formData, {
			schema: uploadMemberSchema,
			async: true,
		})

		if (submission.status !== 'success') {
			return data(
				{ lastResult: submission.reply(), success: false },
				{ status: 400 },
			)
		}

		const { file } = submission.value

		if (!file) {
			return data(
				{
					lastResult: {
						error: 'Veuillez sélectionner un fichier à importer.',
					},
					success: false,
					message: null,
				},
				{ status: 400 },
			)
		}

		try {
			await uploadHonorFamilyMembers(
				file as File,
				currentUser.churchId,
				honorFamilyId,
			)

			return data({
				success: true,
				lastResult: null,
				message: 'Membres ajoutés avec succès',
			})
		} catch (error: any) {
			return data({
				lastResult: { error: error.message },
				success: false,
				message: null,
			})
		}
	}

	if (intent === FORM_INTENT.ADD_ASSISTANT) {
		const submission = await parseWithZod(formData, {
			schema: addAssistantSchema,
			async: true,
		})

		if (submission.status !== 'success') {
			return data(
				{ lastResult: submission.reply(), success: false },
				{ status: 400 },
			)
		}

		const { value } = submission
		await addAssistantToHonorFamily(value, honorFamilyId)

		return data(
			{ success: true, lastResult: submission.reply() },
			{ status: 200 },
		)
	}

	return data({ success: false, lastResult: {} }, { status: 400 })
}

async function exportMembers({
	request,
	customerName,
	honorFamilyId,
}: ExportMembersPayload) {
	const filterData = getUrlParams(request)

	const honorFamily = await getHonorFamilyName(honorFamilyId)

	if (!honorFamily) {
		return data(
			{
				success: false,
				lastResult: null,
				message: "La famille d'honneur n'existe pas",
			},
			{ status: 400 },
		)
	}

	const members = await getExportHonorFamilyMembers({
		id: honorFamilyId,
		filterData,
	})

	const fileName = `Membres de la famille d'Honneur ${honorFamily.name}`

	const fileLink = await createExportHonorFamilyMembersFile({
		fileName,
		members,
		customerName,
	})

	return { success: true, message: null, lastResult: null, fileLink }
}

async function createMember(
	formData: FormData,
	churchId: string,
	honorFamilyId: string,
) {
	const submission = await validateCreateMemberPayload(formData)

	if (submission.status !== 'success') {
		return data(
			{ lastResult: submission.reply(), success: false },
			{ status: 400 },
		)
	}

	await createHonorFamilyMember({
		...submission.value,
		churchId,
		honorFamilyId,
	})

	return data(
		{ success: true, lastResult: submission.reply() },
		{ status: 200 },
	)
}

export type ActionType = typeof actionFn
