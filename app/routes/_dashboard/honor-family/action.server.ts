import {
	addAssistantSchema,
	createMemberSchema,
	uploadMemberSchema,
} from './schema'
import { data, type ActionFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import { FORM_INTENT } from './constants'
import invariant from 'tiny-invariant'
import {
	addAssistantToHonorFamily,
	createExportHonorFamilyMembersFile,
	createMember,
	getExportHonorFamilyMembers,
	getHonorFamilyName,
	getUrlParams,
	superRefineHandler,
	uploadHonorFamilyMembers,
} from './utils/utils.server'
import { notifyAdminForAddedMemberInEntity } from '~/utils/notification.util'

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const { honorFamilyId, churchId, ...currentUser } = await requireUser(request)

	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(churchId, 'Invalid churchId')
	invariant(honorFamilyId, 'honorFamilyId is required')

	if (intent === FORM_INTENT.EXPORT) {
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
			customerName: currentUser.name,
		})

		return { success: true, message: null, lastResult: null, fileLink }
	}

	if (intent === FORM_INTENT.CREATE) {
		const submission = await parseWithZod(formData, {
			schema: createMemberSchema.superRefine((fields, ctx) =>
				superRefineHandler(fields, ctx),
			),
			async: true,
		})

		if (submission.status !== 'success') {
			return data(
				{ lastResult: submission.reply(), success: false, message: null },
				{ status: 400 },
			)
		}

		const { value } = submission
		const member = await createMember(value, churchId, honorFamilyId)

		await notifyAdminForAddedMemberInEntity({
			memberName: member.name,
			entity: 'HONOR_FAMILY',
			entityId: honorFamilyId,
			churchId,
			managerId: currentUser.id,
		})

		return data(
			{ success: true, lastResult: submission.reply(), message: null },
			{ status: 200 },
		)
	}

	if (intent === FORM_INTENT.UPLOAD) {
		const submission = await parseWithZod(formData, {
			schema: uploadMemberSchema,
			async: true,
		})

		if (submission.status !== 'success') {
			return data(
				{ lastResult: submission.reply(), success: false, message: null },
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
			await uploadHonorFamilyMembers(file, churchId, honorFamilyId)

			return {
				success: true,
				lastResult: null,
				message: 'Membres ajoutés avec succès.',
			}
		} catch (error: any) {
			console.error('Error uploading members:', error)

			return {
				lastResult: { error: error.message },
				success: false,
				message: error.message,
			}
		}
	}

	if (intent === FORM_INTENT.ADD_ASSISTANT) {
		const submission = await parseWithZod(formData, {
			schema: addAssistantSchema,
			async: true,
		})

		if (submission.status !== 'success') {
			return data(
				{ lastResult: submission.reply(), success: false, message: null },
				{ status: 400 },
			)
		}

		const { value } = submission
		await addAssistantToHonorFamily(value, honorFamilyId)

		return data(
			{ success: true, lastResult: submission.reply(), message: null },
			{ status: 200 },
		)
	}

	return data(
		{ success: false, lastResult: {}, message: null },
		{ status: 400 },
	)
}

export type ActionData = typeof actionFn
