import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { createTribeSchema } from './schema'
import { z } from 'zod'
import { prisma } from '~/utils/db.server'
import { type Prisma } from '@prisma/client'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { uploadMembers } from '~/utils/member'
import { FORM_INTENT } from './constants'
import { PWD_ERROR_MESSAGE, PWD_REGEX } from '~/shared/constants'
import {
	handleEntityManagerUpdate,
	selectMembers,
	updateIntegrationDates,
} from '~/utils/integration.utils'
import { createFile } from '~/utils/xlsx.server'
import { getDataRows, getTribes } from './utils/server'
import { getQueryFromParams } from '~/utils/url'

const argonSecretKey = process.env.ARGON_SECRET_KEY

const superRefineHandler = async (
	data: z.infer<typeof createTribeSchema>,
	ctx: z.RefinementCtx,
	tribeId?: string,
) => {
	const existingTribe = await prisma.tribe.findFirst({
		where: { id: { not: { equals: tribeId ?? undefined } }, name: data.name },
	})

	const user = await prisma.user.findFirst({
		where: { id: data.tribeManagerId },
		select: { isAdmin: true },
	})

	const isAdmin = user?.isAdmin

	const addCustomIssue = (path: (string | number)[], message: string) => {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path,
			message,
		})
	}

	if (existingTribe) {
		addCustomIssue(['name'], 'Cette tribu a déjà été créée')
	}

	if (!isAdmin) {
		if (!data.password) {
			addCustomIssue(['password'], 'Le mot de passe est requis')
		}

		if (data.password && data.password?.length < 8)
			addCustomIssue(['password'], PWD_ERROR_MESSAGE.min)

		if (!data.password?.match(PWD_REGEX)) {
			addCustomIssue(['password'], PWD_ERROR_MESSAGE.invalid)
		}
	}
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === FORM_INTENT.EXPORT_TRIBE) {
		const query = getQueryFromParams(request)
		invariant(currentUser.churchId, 'Invalid churchId')

		const tribes = await getTribes(query, currentUser.churchId)
		const safeRows = getDataRows(tribes)

		const fileLink = await createFile({
			safeRows,
			feature: 'Tribus',
			customerName: currentUser.name,
		})

		return { success: true, message: null, lastResult: null, fileLink }
	}

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(argonSecretKey, 'ARGON_SECRET_KEY must be defined in .env file')

	const { id: tribeId } = params

	const submission = await parseWithZod(formData, {
		schema: createTribeSchema.superRefine(async (fields, ctx) => {
			await superRefineHandler(fields, ctx, tribeId)
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return {
			lastResult: submission.reply(),
			success: false,
			message: null,
		}
	}

	const payload = submission.value

	if (intent === FORM_INTENT.UPDATE_TRIBE) {
		invariant(tribeId, 'Tribe id is required for update')

		await updateTribe(payload, tribeId, currentUser.churchId)

		return {
			lastResult: submission.reply(),
			success: true,
			message: 'La tribu a été modifiée',
		}
	}

	if (intent === FORM_INTENT.CREATE_TRIBE) {
		await createTribe(payload, currentUser.churchId)

		return {
			lastResult: submission.reply(),
			success: true,
			message: 'La tribu a été créée',
		}
	}

	return {
		lastResult: submission.reply(),
		success: true,
		message: null,
	}
}

async function createTribe(
	data: z.infer<typeof createTribeSchema>,
	churchId: string,
) {
	const { name, tribeManagerId, password, memberIds, membersFile } = data

	await prisma.$transaction(async tx => {
		const uploadedMembers = await uploadMembers(membersFile, churchId)
		const selectedMembers = await selectMembers(memberIds)
		const members = [...uploadedMembers, ...selectedMembers]

		const tribe = await tx.tribe.create({
			data: {
				name,
				managerId: tribeManagerId,
				members: {
					connect: [
						...members.map(member => ({ id: member.id })),
						{ id: tribeManagerId },
					],
				},
				churchId: churchId,
			},
		})

		await handleEntityManagerUpdate({
			tx: tx as unknown as Prisma.TransactionClient,
			entityId: tribe.id,
			entityType: 'tribe',
			newManagerId: tribeManagerId,
			password,
			isCreating: true,
		})

		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'tribe',
			newManagerId: tribeManagerId,
			newMemberIds: [...members.map(m => m.id), tribeManagerId],
			currentMemberIds: [],
		})
	})
}

async function updateTribe(
	data: z.infer<typeof createTribeSchema>,
	tribeId: string,
	churchId: string,
) {
	const { name, tribeManagerId, password, memberIds, membersFile } = data

	await prisma.$transaction(async tx => {
		const currentTribe = await tx.tribe.findUnique({
			where: { id: tribeId },
			select: {
				managerId: true,
				members: {
					select: { id: true },
				},
			},
		})

		invariant(currentTribe, 'Tribe not found')

		const uploadedMembers = await uploadMembers(membersFile, churchId)
		const selectedMembers = await selectMembers(memberIds)
		const members = [...uploadedMembers, ...selectedMembers]

		if (currentTribe.managerId !== tribeManagerId) {
			await handleEntityManagerUpdate({
				tx: tx as unknown as Prisma.TransactionClient,
				entityId: tribeId,
				entityType: 'tribe',
				newManagerId: tribeManagerId,
				oldManagerId: currentTribe.managerId ?? 'N/A',
				password,
				isCreating: false,
			})
		}

		await tx.tribe.update({
			where: { id: tribeId },
			data: {
				name: name,
				managerId: tribeManagerId,
				members: {
					set: [
						...members.map(member => ({ id: member.id })),
						{ id: tribeManagerId },
					],
				},
			},
		})

		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'tribe',
			newManagerId: tribeManagerId,
			oldManagerId: currentTribe.managerId,
			newMemberIds: members.map(m => m.id),
			currentMemberIds: [...members.map(m => m.id), tribeManagerId],
		})
	})
}

export type ActionType = typeof actionFn
