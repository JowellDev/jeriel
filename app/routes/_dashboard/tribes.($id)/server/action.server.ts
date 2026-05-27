import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs } from '@remix-run/node'
import { editTribeSchema } from '../schema'
import { z } from 'zod'
import { prisma } from '~/infrastructures/database/prisma.server'
import { type Prisma } from '@prisma/client'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import { uploadMembers } from '~/helpers/member-upload.server'
import { FORM_INTENT } from '../constants'
import { PWD_ERROR_MESSAGE, PWD_REGEX } from '~/shared/constants'
import {
	handleEntityManagerUpdate,
	selectMembers,
	updateIntegrationDates,
} from '~/helpers/integration.server'
import { createFile } from '~/utils/xlsx.server'
import { getDataRows, getTribes } from '../utils/server'
import { getQueryFromParams } from '~/utils/url'

async function validateTribeNameUnique(
	name: string,
	tribeId: string | undefined,
	ctx: z.RefinementCtx,
) {
	const existingTribe = await prisma.tribe.findFirst({
		where: { id: { not: { equals: tribeId } }, name },
	})
	if (existingTribe) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['name'],
			message: 'Cette tribu existe déjà',
		})
	}
}

async function validateManagerEmailUnique(
	email: string | undefined,
	managerId: string,
	ctx: z.RefinementCtx,
) {
	if (!email) return
	const existing = await prisma.user.findFirst({
		where: { email, id: { not: managerId } },
	})
	if (existing) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['tribeManagerEmail'],
			message: 'Cette adresse email est déjà utilisée.',
		})
	}
}

function validateManagerPassword(
	isAdmin: boolean | undefined,
	password: string | undefined,
	ctx: z.RefinementCtx,
) {
	if (isAdmin) return
	const addIssue = (message: string) =>
		ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message })
	if (!password) {
		addIssue('Le mot de passe est requis')
		return
	}
	if (password.length < 8) addIssue(PWD_ERROR_MESSAGE.min)
	if (!password.match(PWD_REGEX)) addIssue(PWD_ERROR_MESSAGE.invalid)
}

const superRefineHandler = async (
	data: z.infer<typeof editTribeSchema>,
	ctx: z.RefinementCtx,
	tribeId?: string,
) => {
	const user = await prisma.user.findFirst({
		where: { id: data.tribeManagerId },
		select: { isAdmin: true },
	})
	await validateTribeNameUnique(data.name, tribeId, ctx)
	await validateManagerEmailUnique(
		data.tribeManagerEmail,
		data.tribeManagerId,
		ctx,
	)
	validateManagerPassword(user?.isAdmin, data.password, ctx)
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === FORM_INTENT.EXPORT_TRIBE) {
		invariant(currentUser.churchId, 'Invalid churchId')
		const query = getQueryFromParams(request)
		const tribes = await getTribes(query, currentUser.churchId)
		const fileLink = await createFile({
			safeRows: getDataRows(tribes),
			feature: 'Tribus',
			customerName: currentUser.name,
		})
		return { status: 'success', fileLink }
	}

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(
		process.env.ARGON_SECRET_KEY,
		'ARGON_SECRET_KEY must be defined in .env file',
	)

	const { id: tribeId } = params

	const submission = await parseWithZod(formData, {
		schema: editTribeSchema.superRefine(async (fields, ctx) => {
			await superRefineHandler(fields, ctx, tribeId)
		}),
		async: true,
	})

	if (submission.status !== 'success') return submission.reply()

	const { value: payload } = submission

	if (intent === FORM_INTENT.UPDATE_TRIBE) {
		invariant(tribeId, 'Tribe id is required for update')
		await updateTribe(payload, tribeId, currentUser.churchId)
	}

	if (intent === FORM_INTENT.CREATE_TRIBE) {
		await createTribe(payload, currentUser.churchId)
	}

	return { status: 'success' }
}

export type ActionType = typeof actionFn

async function gatherTribeMembers(
	membersFile: File | undefined,
	memberIds: string[] | undefined,
	churchId: string,
) {
	const uploadedMembers = await uploadMembers(membersFile, churchId)
	const selectedMembers = await selectMembers(memberIds)
	return deduplicateById([...uploadedMembers, ...selectedMembers])
}

async function createTribeRecord(
	tx: Prisma.TransactionClient,
	name: string,
	tribeManagerId: string,
	members: { id: string }[],
	churchId: string,
) {
	return tx.tribe.create({
		data: {
			name,
			managerId: tribeManagerId,
			members: {
				connect: [...members.map(m => ({ id: m.id })), { id: tribeManagerId }],
			},
			churchId,
		},
	})
}

async function createTribe(
	data: z.infer<typeof editTribeSchema>,
	churchId: string,
) {
	const {
		name,
		tribeManagerId,
		password,
		tribeManagerEmail,
		memberIds,
		membersFile,
	} = data

	await prisma.$transaction(async tx => {
		const members = await gatherTribeMembers(membersFile, memberIds, churchId)
		const tribe = await createTribeRecord(
			tx as unknown as Prisma.TransactionClient,
			name,
			tribeManagerId,
			members,
			churchId,
		)

		await handleEntityManagerUpdate({
			tx: tx as unknown as Prisma.TransactionClient,
			entityId: tribe.id,
			entityType: 'tribe',
			newManagerId: tribeManagerId,
			password,
			managerEmail: tribeManagerEmail,
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

async function fetchCurrentTribeState(
	tx: Prisma.TransactionClient,
	tribeId: string,
) {
	const tribe = await tx.tribe.findUnique({
		where: { id: tribeId },
		select: { managerId: true, members: { select: { id: true } } },
	})
	invariant(tribe, 'Tribe not found')
	return tribe
}

async function updateTribeRecord(
	tx: Prisma.TransactionClient,
	tribeId: string,
	name: string,
	tribeManagerId: string,
	members: { id: string }[],
) {
	return tx.tribe.update({
		where: { id: tribeId },
		data: {
			name,
			managerId: tribeManagerId,
			members: {
				set: [...members.map(m => ({ id: m.id })), { id: tribeManagerId }],
			},
		},
	})
}

async function updateTribe(
	data: z.infer<typeof editTribeSchema>,
	tribeId: string,
	churchId: string,
) {
	const { name, tribeManagerId, password, memberIds, membersFile } = data

	await prisma.$transaction(async tx => {
		const currentTribe = await fetchCurrentTribeState(
			tx as unknown as Prisma.TransactionClient,
			tribeId,
		)
		const members = await gatherTribeMembers(membersFile, memberIds, churchId)

		if (currentTribe.managerId !== tribeManagerId) {
			await handleEntityManagerUpdate({
				tx: tx as unknown as Prisma.TransactionClient,
				entityId: tribeId,
				entityType: 'tribe',
				newManagerId: tribeManagerId,
				oldManagerId: currentTribe.managerId ?? 'N/D',
				password,
				isCreating: false,
			})
		}

		await updateTribeRecord(
			tx as unknown as Prisma.TransactionClient,
			tribeId,
			name,
			tribeManagerId,
			members,
		)

		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'tribe',
			newManagerId: tribeManagerId,
			oldManagerId: currentTribe.managerId,
			newMemberIds: members.map(m => m.id),
			currentMemberIds: currentTribe.members.map(m => m.id),
		})
	})
}

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
	return Array.from(new Map(items.map(item => [item.id, item])).values())
}
