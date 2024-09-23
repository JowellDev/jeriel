import { addAssistantSchema, createMemberSchema } from './schema'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import { requireUser } from '~/utils/auth.server'
import { parseWithZod } from '@conform-to/zod'
import { FORM_INTENT } from './constants'
import invariant from 'tiny-invariant'
import {
	addAssistantToHonorFamily,
	createMember,
	superRefineHandler,
	uploadHonorFamilyMembers,
} from './utils/utils.server'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const { id: honorFamilyId } = params
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	const membersFile = formData.get('membersFile')

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(honorFamilyId, 'honorFamilyId is required')

	switch (intent) {
		case FORM_INTENT.UPLOAD:
			try {
				await uploadHonorFamilyMembers(
					membersFile as File,
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
		case FORM_INTENT.CREATE: {
			const submission = await parseWithZod(formData, {
				schema: createMemberSchema.superRefine((fields, ctx) =>
					superRefineHandler(fields, ctx),
				),
				async: true,
			})

			if (submission.status !== 'success')
				return json(
					{ lastResult: submission.reply(), success: false },
					{ status: 400 },
				)

			const data = submission.value
			await createMember(data, currentUser.churchId, honorFamilyId)

			return json(
				{ success: true, lastResult: submission.reply() },
				{ status: 200 },
			)
		}
		case FORM_INTENT.ADD_ASSISTANT: {
			const submission = await parseWithZod(formData, {
				schema: addAssistantSchema,
				async: true,
			})

			if (submission.status !== 'success')
				return json(
					{ lastResult: submission.reply(), success: false },
					{ status: 400 },
				)

			const data = submission.value
			await addAssistantToHonorFamily(data, honorFamilyId)

			return json(
				{ success: true, lastResult: submission.reply() },
				{ status: 200 },
			)
		}
		default:
			return json({ success: false, lastResult: {} }, { status: 400 })
	}
}

export type ActionType = typeof actionFn
