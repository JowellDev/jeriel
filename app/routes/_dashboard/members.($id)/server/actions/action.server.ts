import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { editMemberSchema, filterSchema } from '../../schema'
import { z } from 'zod'
import { type AuthenticatedUser, requireUser } from '~/utils/auth.server'
import { FORM_INTENT } from '../../constants'
import { prisma } from '~/infrastructures/database/prisma.server'
import { Role } from '@prisma/client'
import invariant from 'tiny-invariant'

import {
	createMemberFile,
	getExportMembers,
	getFilterOptions,
} from '../../utils/server'
import { saveMemberPicture } from '~/utils/member-picture.server'
import { handleUploadMembers } from './action-handlers/upload-members'

interface EditMemberPayload {
	id?: string
	churchId: string
	data: z.infer<typeof editMemberSchema>
	intent: string
}

const isEmailExists = async (
	{ email }: Partial<z.infer<typeof editMemberSchema>>,
	userId?: string,
) => {
	if (!email) return false

	const field = await prisma.user.findFirst({
		where: { email, id: { not: userId } },
	})

	return !!field
}

const superRefineHandler = async (
	data: Partial<z.infer<typeof editMemberSchema>>,
	ctx: z.RefinementCtx,
	userId?: string,
) => {
	const isExists = await isEmailExists(data, userId)

	if (isExists) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['email'],
			message: 'Adresse email déjà utilisée',
		})
	}
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const { id: memberId } = params
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent') as string

	invariant(currentUser.churchId, 'Invalid churchId')

	if (intent === FORM_INTENT.EXPORT) return exportMembers(request, currentUser)

	if (intent === FORM_INTENT.UPLOAD)
		return handleUploadMembers(formData, currentUser.churchId)

	const submission = await parseWithZod(formData, {
		schema: editMemberSchema.superRefine((fields, ctx) =>
			superRefineHandler(fields, ctx, memberId),
		),
		async: true,
	})

	if (submission.status !== 'success') return submission.reply()

	const { value } = submission

	if (intent && [FORM_INTENT.EDIT, FORM_INTENT.CREATE].includes(intent)) {
		await editMember({
			intent,
			id: memberId,
			churchId: currentUser.churchId,
			data: value,
		})
	}

	return { status: 'success' }
}

export type ActionType = typeof actionFn

async function editMember({ id, churchId, intent, data }: EditMemberPayload) {
	const { tribeId, departmentId, honorFamilyId, picture, ...rest } = data
	const pictureUrl = picture ? await saveMemberPicture(picture) : null
	const isUpdate = intent === FORM_INTENT.EDIT

	const payload = {
		...rest,
		...(!isUpdate && {
			roles: [Role.MEMBER],
			church: { connect: { id: churchId } },
		}),
		...(pictureUrl && { pictureUrl }),
		...(tribeId && { tribe: { connect: { id: tribeId } } }),
		...(departmentId && { department: { connect: { id: departmentId } } }),
		...(honorFamilyId && { honorFamily: { connect: { id: honorFamilyId } } }),
	}

	return isUpdate && id
		? prisma.user.update({ where: { id }, data: payload })
		: prisma.user.create({ data: payload })
}

async function exportMembers(request: Request, currentUser: AuthenticatedUser) {
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const where = getFilterOptions(submission.value, currentUser)

	const members = await getExportMembers(where)

	const fileLink = await createMemberFile({
		members,
		feature: 'Membres',
		customerName: currentUser.name,
	})

	return { status: 'success', fileLink }
}
