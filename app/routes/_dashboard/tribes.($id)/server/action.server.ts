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

async function handleExportTribe(
	request: Request,
	currentUser: Awaited<ReturnType<typeof requireUser>>,
) {
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

async function handleTribeSubmission(
	formData: FormData,
	intent: FormDataEntryValue | null,
	tribeId: string | undefined,
	churchId: string,
) {
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
		await updateTribe(payload, tribeId, churchId)
	}
	if (intent === FORM_INTENT.CREATE_TRIBE) await createTribe(payload, churchId)
	return { status: 'success' }
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(currentUser.churchId, 'Invalid churchId')

	if (intent === FORM_INTENT.EXPORT_TRIBE)
		return handleExportTribe(request, currentUser)

	invariant(
		process.env.ARGON_SECRET_KEY,
		'ARGON_SECRET_KEY must be defined in .env file',
	)

	return handleTribeSubmission(
		formData,
		intent,
		params.id,
		currentUser.churchId,
	)
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

async function initializeTribe(
	tx: Prisma.TransactionClient,
	tribe: { id: string },
	data: z.infer<typeof editTribeSchema>,
	members: { id: string }[],
) {
	const { tribeManagerId, password, tribeManagerEmail } = data

	await handleEntityManagerUpdate({
		tx,
		entityId: tribe.id,
		entityType: 'tribe',
		newManagerId: tribeManagerId,
		password,
		managerEmail: tribeManagerEmail,
		isCreating: true,
	})

	await updateIntegrationDates({
		tx,
		entityType: 'tribe',
		newManagerId: tribeManagerId,
		newMemberIds: [...members.map(m => m.id), tribeManagerId],
		currentMemberIds: [],
	})
}

async function createTribe(
	data: z.infer<typeof editTribeSchema>,
	churchId: string,
) {
	const { name, tribeManagerId, memberIds, membersFile } = data

	await prisma.$transaction(async tx => {
		const txClient = tx as unknown as Prisma.TransactionClient
		const members = await gatherTribeMembers(membersFile, memberIds, churchId)
		const tribe = await createTribeRecord(
			txClient,
			name,
			tribeManagerId,
			members,
			churchId,
		)

		await initializeTribe(txClient, tribe, data, members)
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

async function applyTribeManagerChange(
	tx: Prisma.TransactionClient,
	tribeId: string,
	data: z.infer<typeof editTribeSchema>,
	currentManagerId: string | null,
) {
	if (currentManagerId === data.tribeManagerId) return

	await handleEntityManagerUpdate({
		tx,
		entityId: tribeId,
		entityType: 'tribe',
		newManagerId: data.tribeManagerId,
		oldManagerId: currentManagerId ?? 'N/D',
		password: data.password,
		isCreating: false,
	})
}

async function applyTribeUpdate(
	tx: Prisma.TransactionClient,
	tribeId: string,
	data: z.infer<typeof editTribeSchema>,
	currentTribe: { managerId: string | null; members: { id: string }[] },
	members: { id: string }[],
) {
	await applyTribeManagerChange(tx, tribeId, data, currentTribe.managerId)
	await updateTribeRecord(tx, tribeId, data.name, data.tribeManagerId, members)

	await updateIntegrationDates({
		tx,
		entityType: 'tribe',
		newManagerId: data.tribeManagerId,
		oldManagerId: currentTribe.managerId,
		newMemberIds: members.map(m => m.id),
		currentMemberIds: currentTribe.members.map(m => m.id),
	})
}

async function updateTribe(
	data: z.infer<typeof editTribeSchema>,
	tribeId: string,
	churchId: string,
) {
	await prisma.$transaction(async tx => {
		const txClient = tx as unknown as Prisma.TransactionClient
		const [currentTribe, members] = await Promise.all([
			fetchCurrentTribeState(txClient, tribeId),
			gatherTribeMembers(data.membersFile, data.memberIds, churchId),
		])

		await applyTribeUpdate(txClient, tribeId, data, currentTribe, members)
	})
}

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
	return Array.from(new Map(items.map(item => [item.id, item])).values())
}
