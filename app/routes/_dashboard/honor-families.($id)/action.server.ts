import { json, type ActionFunctionArgs } from '@remix-run/node'
import { createHonorFamilySchema } from './schema'
import { getBaseUrl, requireUser } from '~/utils/auth.server'
import invariant from 'tiny-invariant'
import { parseWithZod } from '@conform-to/zod'
import { FORM_INTENT } from './constants'
import { type z } from 'zod'
import { prisma } from '~/utils/db.server'
import { superRefineHandler } from './utils/server'
import type { Prisma } from '@prisma/client'
import { uploadMembers } from '~/utils/member'
import {
	handleEntityManagerUpdate,
	selectMembers,
	updateIntegrationDates,
} from '~/utils/integration.utils'
import * as XLSX from 'xlsx'
import * as fs from 'fs/promises'
import * as path from 'path'
import { HonorFamilyExport } from './types'

export const actionFn = async ({ request, params }: ActionFunctionArgs) => {
	const { churchId } = await requireUser(request)
	invariant(churchId, 'Invalid churchId')

	const formData = await request.formData()
	const intent = formData.get('intent')
	const { id: honorFamilyId } = params

	if (intent === FORM_INTENT.EXPORT) {
		const baseUrl = await getBaseUrl(request)

		const honorFamilies = await getHonorFamilies()

		const fileLink = await createFile(honorFamilies, baseUrl)

		return json({ success: true, fileLink })
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

export async function createFile(
	honorFamilies: HonorFamilyExport[],
	baseUrl: string,
): Promise<string> {
	const workbook = XLSX.utils.book_new()

	appendWorksheet(workbook, honorFamilies)

	const file = getXlsxFile(workbook)
	const fileName = getFileName()
	const path = `/public/uploads/${fileName}.xlsx`

	await saveFile(file, path)

	return `${baseUrl}/uploads/${fileName}.xlsx`
}

function getFileName(): string {
	const today = new Date()
	const formattedDate = today.toISOString().split('T')[0]
	return `honor-families-${formattedDate}`
}

function getXlsxFile(workbook: XLSX.WorkBook): Buffer {
	return XLSX.writeXLSX(workbook, { type: 'buffer', bookType: 'xlsx' })
}

function appendWorksheet(
	workbook: XLSX.WorkBook,
	honorFamilies: HonorFamilyExport[],
	sheetName: string = "Familles d'Honneur",
) {
	XLSX.utils.book_append_sheet(
		workbook,
		XLSX.utils.json_to_sheet(
			honorFamilies.map(h => ({
				Nom: h.name,
				Responsable: h.manager.name,
				'N°. responsable': h.manager.phone,
				'Total membres': h.members.length,
			})),
		),
		sheetName,
	)
}

async function saveFile(file: Buffer, filePath: string): Promise<string> {
	const fullPath = path.join(process.cwd(), filePath)

	await fs.mkdir(path.dirname(fullPath), { recursive: true })

	await fs.writeFile(fullPath, file)

	return filePath
}

async function getHonorFamilies() {
	const selectedData = {
		name: true,
		manager: { select: { name: true, phone: true } },
		members: { select: { id: true } },
	} satisfies Prisma.HonorFamilySelect

	return await prisma.honorFamily.findMany({
		select: selectedData,
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
				entityType: 'family',
				newManagerId: data.managerId,
				password: data.password,
				isCreating: true,
			})
		}

		await updateIntegrationDates({
			tx: tx as unknown as Prisma.TransactionClient,
			entityType: 'family',
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

		invariant(currentHonorFamily, 'Honor family not found')

		const uploadedMembers = await uploadMembers(membersFile, churchId)
		const selectedMembers = await selectMembers(memberIds)
		const members = [...uploadedMembers, ...selectedMembers]

		if (password && currentHonorFamily.managerId !== managerId) {
			await handleEntityManagerUpdate({
				tx: tx as unknown as Prisma.TransactionClient,
				entityId: honorFamilyId,
				entityType: 'family',
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
			entityType: 'family',
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
