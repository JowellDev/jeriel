import {
	addAssistantSchema,
	createMemberSchema,
	uploadMemberSchema,
} from './schema'
import { json, type ActionFunctionArgs } from '@remix-run/node'
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

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)

	const { id: honorFamilyId } = params

	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(honorFamilyId, 'honorFamilyId is required')

	if (intent === FORM_INTENT.EXPORT) {
		const filterData = getUrlParams(request)

		const honorFamily = await getHonorFamilyName(honorFamilyId)

		if (!honorFamily) {
			return json(
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

		return json({ success: true, message: null, lastResult: null, fileLink })
	}

	if (intent === FORM_INTENT.CREATE) {
		const submission = await parseWithZod(formData, {
			schema: createMemberSchema.superRefine((fields, ctx) =>
				superRefineHandler(fields, ctx),
			),
			async: true,
		})

		if (submission.status !== 'success') {
			return json(
				{ lastResult: submission.reply(), success: false },
				{ status: 400 },
			)
		}

		const { value } = submission
		await createMember(value, currentUser.churchId, honorFamilyId)

		return json(
			{ success: true, lastResult: submission.reply() },
			{ status: 200 },
		)
	}

	if (intent === FORM_INTENT.UPLOAD) {
		const submission = await parseWithZod(formData, {
			schema: uploadMemberSchema,
			async: true,
		})

		if (submission.status !== 'success') {
			return json(
				{ lastResult: submission.reply(), success: false },
				{ status: 400 },
			)
		}

		const { file } = submission.value

		if (!file) {
			return json(
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

			return json({
				success: true,
				lastResult: null,
				message: 'Membres ajoutés avec succès',
			})
		} catch (error: any) {
			return json({
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
			return json(
				{ lastResult: submission.reply(), success: false },
				{ status: 400 },
			)
		}

		const data = submission.value
		await addAssistantToHonorFamily(data, honorFamilyId)

		return json(
			{ success: true, lastResult: submission.reply() },
			{ status: 200 },
		)
	}

	return json({ success: false, lastResult: {} }, { status: 400 })
}

export type ActionType = typeof actionFn
