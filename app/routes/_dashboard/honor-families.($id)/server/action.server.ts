import { type ActionFunctionArgs } from '@remix-run/node'
import { createHonorFamilySchema } from '../schema'
import { requireUser } from '~/utils/auth.server'
import invariant from 'tiny-invariant'
import { parseWithZod } from '@conform-to/zod'
import { EXPORT_HONOR_FAMILY_SELECT, FORM_INTENT } from '../constants'
import { type z } from 'zod'
import { prisma } from '~/infrastructures/database/prisma.server'
import { buildHonorFamilyWhere, superRefineHandler } from '../utils/server'
import type { Prisma } from '@prisma/client'
import { uploadMembers } from '~/helpers/member-upload.server'
import {
	handleEntityManagerUpdate,
	selectMembers,
	updateIntegrationDates,
} from '~/helpers/integration.server'
import { createHonorFamiliesExcelFile } from '~/utils/excel.server'
import { getQueryFromParams } from '~/utils/url'

async function handleExportHonorFamilies(request: Request, churchId: string) {
	const honorFamilies = await getHonorFamilies(
		getQueryFromParams(request),
		churchId,
	)
	const fileLink = await createHonorFamiliesExcelFile(honorFamilies)
	return { status: 'success', fileLink }
}

async function handleCreateOrEditHonorFamily(
	formData: FormData,
	intent: FormDataEntryValue | null,
	honorFamilyId: string | undefined,
	churchId: string,
) {
	const submission = await parseWithZod(formData, {
		schema: createHonorFamilySchema.superRefine((fields, ctx) =>
			superRefineHandler(fields, ctx, honorFamilyId),
		),
		async: true,
	})
	if (submission.status !== 'success') return submission.reply()
	if (intent === FORM_INTENT.CREATE)
		await createHonorFamily(submission.value, churchId)
	if (intent === FORM_INTENT.EDIT && honorFamilyId)
		await editHonorFamily(submission.value, honorFamilyId, churchId)
	return { status: 'success' }
}

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const { churchId, ...user } = await requireUser(request)
	invariant(churchId, 'Invalid churchId')
	const formData = await request.formData()
	const intent = formData.get('intent')
	const { id: honorFamilyId } = params
	if (intent === FORM_INTENT.EXPORT)
		return handleExportHonorFamilies(request, churchId)
	return handleCreateOrEditHonorFamily(
		formData,
		intent,
		honorFamilyId,
		churchId,
	)
}

async function getHonorFamilies(query: string, churchId: string) {
	return prisma.honorFamily.findMany({
		where: buildHonorFamilyWhere(query, churchId),
		select: EXPORT_HONOR_FAMILY_SELECT,
		orderBy: { name: 'asc' },
	})
}

async function gatherHonorFamilyMembers(
	membersFile: File | undefined,
	memberIds: string[] | undefined,
	churchId: string,
) {
	const uploadedMembers = await uploadMembers(membersFile, churchId)
	const selectedMembers = await selectMembers(memberIds)
	return deduplicateById([...uploadedMembers, ...selectedMembers])
}

async function createHonorFamilyRecord(
	tx: Prisma.TransactionClient,
	data: z.infer<typeof createHonorFamilySchema>,
	churchId: string,
	members: { id: string }[],
) {
	return tx.honorFamily.create({
		data: {
			churchId,
			name: data.name,
			location: data.location,
			managerId: data.managerId,
			members: {
				connect: [...members.map(m => ({ id: m.id })), { id: data.managerId }],
			},
		},
	})
}

async function initializeHonorFamily(
	tx: Prisma.TransactionClient,
	honorFamilyId: string,
	data: z.infer<typeof createHonorFamilySchema>,
	members: { id: string }[],
) {
	await handleEntityManagerUpdate({
		tx,
		entityId: honorFamilyId,
		entityType: 'honorFamily',
		newManagerId: data.managerId,
		password: data.password,
		managerEmail: data.managerEmail,
		isCreating: true,
	})
	await updateIntegrationDates({
		tx,
		entityType: 'honorFamily',
		newManagerId: data.managerId,
		newMemberIds: [...members.map(m => m.id), data.managerId],
		currentMemberIds: [],
	})
}

async function createHonorFamily(
	data: z.infer<typeof createHonorFamilySchema>,
	churchId: string,
) {
	await prisma.$transaction(async tx => {
		const txClient = tx as unknown as Prisma.TransactionClient
		const members = await gatherHonorFamilyMembers(
			data.membersFile,
			data.memberIds,
			churchId,
		)
		const honorFamily = await createHonorFamilyRecord(
			txClient,
			data,
			churchId,
			members,
		)
		await initializeHonorFamily(txClient, honorFamily.id, data, members)
	})
}

async function fetchCurrentHonorFamilyState(
	tx: Prisma.TransactionClient,
	honorFamilyId: string,
) {
	const honorFamily = await tx.honorFamily.findUnique({
		where: { id: honorFamilyId },
		select: { managerId: true, members: { select: { id: true } } },
	})
	invariant(honorFamily, 'Honor family not found')
	return honorFamily
}

async function updateHonorFamilyRecord(
	tx: Prisma.TransactionClient,
	honorFamilyId: string,
	data: z.infer<typeof createHonorFamilySchema>,
	members: { id: string }[],
) {
	return tx.honorFamily.update({
		where: { id: honorFamilyId },
		data: {
			name: data.name,
			location: data.location,
			managerId: data.managerId,
			members: {
				set: [...members.map(m => ({ id: m.id })), { id: data.managerId }],
			},
		},
	})
}

async function applyHonorFamilyEdit(
	tx: Prisma.TransactionClient,
	honorFamilyId: string,
	data: z.infer<typeof createHonorFamilySchema>,
	current: { managerId: string | null; members: { id: string }[] },
	members: { id: string }[],
) {
	const { managerId, password, managerEmail } = data
	await handleEntityManagerUpdate({
		tx,
		entityId: honorFamilyId,
		entityType: 'honorFamily',
		newManagerId: managerId,
		oldManagerId: current.managerId || undefined,
		password,
		managerEmail,
		isCreating: false,
	})

	await updateHonorFamilyRecord(tx, honorFamilyId, data, members)

	await updateIntegrationDates({
		tx,
		entityType: 'honorFamily',
		newManagerId: managerId,
		oldManagerId: current.managerId,
		newMemberIds: members.map(m => m.id),
		currentMemberIds: [...current.members.map(m => m.id), managerId],
	})
}

async function editHonorFamily(
	data: z.infer<typeof createHonorFamilySchema>,
	honorFamilyId: string,
	churchId: string,
) {
	await prisma.$transaction(async tx => {
		const txClient = tx as unknown as Prisma.TransactionClient
		const [current, members] = await Promise.all([
			fetchCurrentHonorFamilyState(txClient, honorFamilyId),
			gatherHonorFamilyMembers(data.membersFile, data.memberIds, churchId),
		])

		await applyHonorFamilyEdit(txClient, honorFamilyId, data, current, members)
	})
}

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
	return Array.from(new Map(items.map(item => [item.id, item])).values())
}

export type ActionData = typeof actionFn
