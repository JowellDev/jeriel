import { parseWithZod } from '@conform-to/zod'
import { type Prisma, Role } from '@prisma/client'
import { type ActionFunctionArgs, data } from '@remix-run/node'
import invariant from 'tiny-invariant'
import { z } from 'zod'
import { FORM_INTENT } from '~/shared/constants'
import { createEntityMemberSchema, uploadMemberSchema } from '~/shared/schema'
import { requireUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import { updateIntegrationDates } from '~/utils/integration.utils'
import { uploadMembers } from '~/utils/member'
import { saveMemberPicture } from '~/utils/member-picture.server'
import { notifyAdminForAddedMemberInEntity } from '~/utils/notification.util'

const isPhoneExists = async ({
	phone,
}: Partial<z.infer<typeof createEntityMemberSchema>>) => {
	const field = await prisma.user.findFirst({
		where: { phone },
	})

	return !!field
}

const superRefineHandler = async (
	data: Partial<z.infer<typeof createEntityMemberSchema>>,
	ctx: z.RefinementCtx,
) => {
	const isExists = await isPhoneExists(data)

	if (isExists) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['phone'],
			message: 'Numéro de téléphone déjà utilisé',
		})
	}
}

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(currentUser.tribeId, 'tribeId is required')

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
					lastResult: { error: 'Veuillez sélectionner un fichier à importer.' },
					success: false,
					message: null,
				},
				{ status: 400 },
			)
		}

		try {
			await uploadTribeMembers(file, currentUser.churchId, currentUser.tribeId)
			return {
				success: true,
				lastResult: null,
				message: 'Membres ajoutés avec succès.',
			}
		} catch (error: any) {
			return {
				lastResult: { error: error.message },
				success: false,
				message: null,
			}
		}
	}

	if (intent === FORM_INTENT.CREATE) {
		const submission = await parseWithZod(formData, {
			schema: createEntityMemberSchema.superRefine((fields, ctx) =>
				superRefineHandler(fields, ctx),
			),
			async: true,
		})

		if (submission.status !== 'success')
			return data(
				{ lastResult: submission.reply(), success: false },
				{ status: 400 },
			)

		const { value } = submission
		const member = await createMember(
			value,
			currentUser.churchId,
			currentUser.tribeId,
		)

		await notifyAdminForAddedMemberInEntity({
			memberName: member.name,
			entity: 'TRIBE',
			entityId: currentUser.tribeId,
			churchId: currentUser.churchId,
			managerId: currentUser.id,
		})

		return data(
			{ success: true, lastResult: submission.reply() },
			{ status: 200 },
		)
	}
}

async function createMember(
	data: z.infer<typeof createEntityMemberSchema>,
	churchId: string,
	tribeId: string,
) {
	const { picture, ...rest } = data
	const pictureUrl = picture ? await saveMemberPicture(picture) : null
	return prisma.user.create({
		data: {
			...rest,
			...(pictureUrl && { pictureUrl }),
			roles: [Role.MEMBER],
			church: { connect: { id: churchId } },
			tribe: { connect: { id: tribeId } },
			integrationDate: { create: { tribeDate: new Date() } },
		},
	})
}

async function uploadTribeMembers(
	file: File,
	churchId: string,
	tribeId: string,
) {
	const uploadedMembers = await uploadMembers(file, churchId)

	await prisma.$transaction(async tx => {
		await prisma.tribe.update({
			where: { id: tribeId },
			data: {
				members: {
					connect: uploadedMembers.map(member => ({ id: member.id })),
				},
			},
		})

		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'tribe',
			newMemberIds: [...uploadedMembers.map(m => m.id)],
			currentMemberIds: [],
		})
	})
}

export type ActionType = typeof actionFn
