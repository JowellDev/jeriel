import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { editMemberSchema } from '../../schema'
import { z } from 'zod'
import { requireUser } from '~/utils/auth.server'
import { FORM_INTENT } from '../../constants'
import { prisma } from '~/infrastructures/database/prisma.server'
import { Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { saveMemberPicture } from '~/helpers/member-picture.server'
import { handleUploadMembers } from './action-handlers/upload-members'
import { exportMembers } from './action-handlers/export-member'

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

function buildEntityConnections(
	tribeId?: string,
	departmentId?: string,
	honorFamilyId?: string,
) {
	return {
		...(tribeId && { tribe: { connect: { id: tribeId } } }),
		...(departmentId && { department: { connect: { id: departmentId } } }),
		...(honorFamilyId && { honorFamily: { connect: { id: honorFamilyId } } }),
	}
}

async function createNewMember(
	rest: any,
	entityConnections: any,
	churchId: string,
	tribeId?: string,
	departmentId?: string,
	honorFamilyId?: string,
	pictureUrl?: string | null,
) {
	return prisma.user.create({
		data: {
			...rest,
			roles: [Role.MEMBER],
			church: { connect: { id: churchId } },
			...(pictureUrl && { pictureUrl }),
			...entityConnections,
			integrationDate: {
				create: {
					tribeDate: tribeId ? new Date() : null,
					departementDate: departmentId ? new Date() : null,
					familyDate: honorFamilyId ? new Date() : null,
				},
			},
		},
	})
}

async function fetchCurrentMemberEntities(id: string) {
	return prisma.user.findUnique({
		where: { id },
		select: { tribeId: true, departmentId: true, honorFamilyId: true },
	})
}

function buildIntegrationDateUpdate(
	tribeId: string | undefined,
	departmentId: string | undefined,
	honorFamilyId: string | undefined,
	currentMember: {
		tribeId: string | null
		departmentId: string | null
		honorFamilyId: string | null
	} | null,
) {
	const now = new Date()
	const fields: Record<string, Date | null> = {}

	if (tribeId && tribeId !== currentMember?.tribeId) fields.tribeDate = now

	if (departmentId && departmentId !== currentMember?.departmentId)
		fields.departementDate = now

	if (honorFamilyId && honorFamilyId !== currentMember?.honorFamilyId)
		fields.familyDate = now

	return fields
}

async function updateExistingMember(
	id: string,
	rest: any,
	entityConnections: any,
	integrationFields: Record<string, Date | null>,
	pictureUrl?: string | null,
) {
	return prisma.user.update({
		where: { id },
		data: {
			...rest,
			...(pictureUrl && { pictureUrl }),
			...entityConnections,
			...(Object.keys(integrationFields).length > 0 && {
				integrationDate: {
					upsert: { create: integrationFields, update: integrationFields },
				},
			}),
		},
	})
}

async function editMember({ id, churchId, intent, data }: EditMemberPayload) {
	const { tribeId, departmentId, honorFamilyId, picture, ...rest } = data
	const pictureUrl = picture ? await saveMemberPicture(picture) : null

	const isUpdate = intent === FORM_INTENT.EDIT

	const entityConnections = buildEntityConnections(
		tribeId,
		departmentId,
		honorFamilyId,
	)

	if (!isUpdate || !id) {
		return createNewMember(
			rest,
			entityConnections,
			churchId,
			tribeId,
			departmentId,
			honorFamilyId,
			pictureUrl,
		)
	}

	const currentMember = await fetchCurrentMemberEntities(id)
	const integrationFields = buildIntegrationDateUpdate(
		tribeId,
		departmentId,
		honorFamilyId,
		currentMember,
	)

	return updateExistingMember(
		id,
		rest,
		entityConnections,
		integrationFields,
		pictureUrl,
	)
}
