import { json, type ActionFunctionArgs } from '@remix-run/node'
import { createHonorFamilySchema } from './schema'
import { requireUser } from '~/utils/auth.server'
import invariant from 'tiny-invariant'
import { parseWithZod } from '@conform-to/zod'
import { EXPORT_HONOR_FAMILY_SELECT, FORM_INTENT } from './constants'
import { type z } from 'zod'
import { prisma } from '~/utils/db.server'
import { buildHonorFamilyWhere, superRefineHandler } from './utils/server'
import type { Prisma } from '@prisma/client'
import { uploadMembers } from '~/utils/member'
import {
	handleEntityManagerUpdate,
	selectMembers,
	updateIntegrationDates,
} from '~/utils/integration.utils'
import type { HonorFamilyExport } from './types'
import { createFile } from '~/utils/xlsx.server'
import { getQueryFromParams } from '~/utils/url'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const { churchId, ...user } = await requireUser(request)
	invariant(churchId, 'Invalid churchId')

	const formData = await request.formData()
	const intent = formData.get('intent')
	const { id: honorFamilyId } = params

	if (intent === FORM_INTENT.EXPORT) {
		const query = getQueryFromParams(request)

		const honorFamilies = await getHonorFamilies(query, churchId)

		const safeRows = getDataRows(honorFamilies)

		const fileLink = await createFile({
			safeRows,
			feature: "Familles d'Honneur",
			customerName: user.name,
		})

		return json({ success: true, message: null, lastResult: null, fileLink })
	}

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
			'honor honorFamily id is required to update a honor honorFamily',
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

function getDataRows(
	honorFamilies: HonorFamilyExport[],
): Record<string, string>[] {
	return honorFamilies.map(h => ({
		Nom: h.name,
		Responsable: h.manager.name,
		'N°. responsable': h.manager.phone,
		'Total membres': h.members.length.toString(),
	}))
}

async function getHonorFamilies(query: string, churchId: string) {
	const where = buildHonorFamilyWhere(query, churchId)

	return await prisma.honorFamily.findMany({
		where,
		select: EXPORT_HONOR_FAMILY_SELECT,
		orderBy: { name: 'asc' },
	})
}

async function createHonorFamily(
	data: z.infer<typeof createHonorFamilySchema>,
	churchId: string,
) {
	await prisma.$transaction(async tx => {
		const uploadedMembers = await uploadMembers(data.membersFile, churchId)

		const selectedMembers = await selectMembers(data.memberIds)

		const members = [...uploadedMembers, ...selectedMembers]

		const honorFamily = await tx.honorFamily.create({
			data: {
				churchId,
				name: data.name,
				location: data.location,
				managerId: data.managerId,
				members: {
					connect: [
						...members.map(m => ({ id: m.id })),
						{ id: data?.managerId },
					],
				},
			},
		})

		if (data.password) {
			await handleEntityManagerUpdate({
				tx: tx as unknown as Prisma.TransactionClient,
				entityId: honorFamily.id,
				entityType: 'honorFamily',
				newManagerId: data.managerId,
				password: data.password,
				isCreating: true,
			})
		}

		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'honorFamily',
			newManagerId: data.managerId,
			newMemberIds: [...members.map(m => m.id), data.managerId],
			currentMemberIds: [],
		})
	})
}

async function editHonorFamily(
	data: z.infer<typeof createHonorFamilySchema>,
	honorFamilyId: string,
	churchId: string,
) {
	const { name, location, managerId, password, memberIds, membersFile } = data

	await prisma.$transaction(async tx => {
		const currentHonorFamily = await tx.honorFamily.findUnique({
			where: { id: honorFamilyId },
			select: {
				managerId: true,
				members: {
					select: { id: true },
				},
			},
		})

		invariant(currentHonorFamily, 'Honor honorFamily not found')

		const uploadedMembers = await uploadMembers(membersFile, churchId)
		const selectedMembers = await selectMembers(memberIds)
		const members = [...uploadedMembers, ...selectedMembers]

		if (password && currentHonorFamily.managerId !== managerId) {
			await handleEntityManagerUpdate({
				tx: tx as unknown as Prisma.TransactionClient,
				entityId: honorFamilyId,
				entityType: 'honorFamily',
				newManagerId: managerId,
				oldManagerId: currentHonorFamily.managerId,
				password,
				isCreating: false,
			})
		}

		await tx.honorFamily.update({
			where: { id: honorFamilyId },
			data: {
				name: name,
				location: location,
				managerId: managerId,
				members: {
					set: [...members.map(m => ({ id: m.id })), { id: managerId }],
				},
			},
		})

		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'honorFamily',
			newManagerId: managerId,
			oldManagerId: currentHonorFamily.managerId,
			newMemberIds: members.map(m => m.id),
			currentMemberIds: [
				...currentHonorFamily.members.map(m => m.id),
				managerId,
			],
		})
	})
}

export type ActionData = typeof actionFn
