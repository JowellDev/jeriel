import { json, type ActionFunctionArgs } from '@remix-run/node'
import { createHonorFamilySchema } from './schema'
import { requireUser } from '~/utils/auth.server'
import invariant from 'tiny-invariant'
import { parseWithZod } from '@conform-to/zod'
import { FORM_INTENT } from './constants'
import { type z } from 'zod'
import { prisma } from '~/utils/db.server'
import {
	selectedMembersId,
	superRefineHandler,
	updateManagerPassword,
} from './utils/server'
import { Prisma } from '@prisma/client'
import { uploadMembers } from '~/utils/member'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const { churchId } = await requireUser(request)
	invariant(churchId, 'Invalid churchId')

	const formData = await request.formData()
	const intent = formData.get('intent')
	const { id: honorFamilyId } = params

	const submission = await parseWithZod(formData, {
		schema: createHonorFamilySchema.superRefine((fields, ctx) =>
			superRefineHandler(fields, ctx, honorFamilyId),
		),
		async: true,
	})

	if (submission.status !== 'success') {
		return json(
			{ lastResult: submission.reply(), success: false, message: null },
			{ status: 400 },
		)
	}

	if (intent === FORM_INTENT.CREATE) {
		await createHonorFamily(submission.value, churchId)

		return json({
			success: true,
			lastResult: submission.reply(),
			message: "La famille d'honneur a été créee avec succès",
		})
	}

	if (intent === FORM_INTENT.EDIT) {
		invariant(
			honorFamilyId,
			'honor family id is required to update a honor family',
		)
		await editHonorFamily(submission.value, honorFamilyId, churchId)

		return json({
			success: true,
			lastResult: submission.reply(),
			message: "La famille d'honneur a été modifié avec succès",
		})
	}

	return json({
		lastResult: submission.reply(),
		success: true,
		message: null,
	})
}

async function createHonorFamily(
	data: z.infer<typeof createHonorFamilySchema>,
	churchId: string,
) {
	await prisma.$transaction(async tx => {
		if (data.password) {
			await updateManagerPassword(
				data.managerId,
				data.password,
				tx as unknown as Prisma.TransactionClient,
			)
		}

		const uploadedMembers = (
			await uploadMembers(data.membersFile, churchId)
		).map(m => m.id)

		const selectedMembers = await selectedMembersId(data.membersId)

		const members = [...uploadedMembers, ...selectedMembers]

		await tx.honorFamily.create({
			data: {
				churchId,
				name: data.name,
				location: data.location,
				managerId: data.managerId,
				members: { connect: members.map(m => ({ id: m })) },
			},
		})
	})
}

async function editHonorFamily(
	data: z.infer<typeof createHonorFamilySchema>,
	honorFamilyId: string,
	churchId: string,
) {
	const { name, location, managerId, password, membersId, membersFile } = data

	await prisma.$transaction(async tx => {
		if (password)
			await updateManagerPassword(
				managerId,
				password,
				tx as unknown as Prisma.TransactionClient,
			)

		const uploadedMembers = (await uploadMembers(membersFile, churchId)).map(
			m => m.id,
		)

		const selectedMembers = await selectedMembersId(membersId)

		const members = [...uploadedMembers, ...selectedMembers]

		await tx.user.updateMany({
			where: { honorFamilyId },
			data: { honorFamilyId: null },
		})

		await tx.honorFamily.update({
			where: { id: honorFamilyId },
			data: {
				name: name,
				location: location,
				managerId: managerId,
				members: { connect: members.map(m => ({ id: m })) },
			},
		})
	})
}

export type ActionData = typeof actionFn
