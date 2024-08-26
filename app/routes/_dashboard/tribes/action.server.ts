import { parseWithZod } from '@conform-to/zod'
import { json, type ActionFunctionArgs } from '@remix-run/node'
import { createTribeSchema, memberSchema } from './schema'
import { z } from 'zod'
import { prisma } from '~/utils/db.server'
import { Role } from '@prisma/client'
import invariant from 'tiny-invariant'
import { requireUser } from '~/utils/auth.server'
import * as XLSX from 'xlsx'
import type { CreateMemberPayload, FileData, Member } from './types'
import { hash } from '@node-rs/argon2'

const argonSecretKey = process.env.ARGON_SECRET_KEY

const superRefineHandler = async (
	{ name, tribeManagerId }: { name: string; tribeManagerId: string },
	ctx: z.RefinementCtx,
	id?: string,
) => {
	const [existingTribe, existingTribeManager] = await Promise.all([
		prisma.tribe.findFirst({
			where: { id: { not: { equals: id ?? undefined } }, name },
		}),
		prisma.user.findFirst({
			where: {
				id: tribeManagerId,
			},
		}),
	])

	const addCustomIssue = (path: (string | number)[], message: string) => {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path,
			message,
		})
	}

	if (existingTribe) {
		addCustomIssue(['name'], 'Cette tribu a déjà été créee')
	}

	if (existingTribeManager) {
		addCustomIssue(['tribeManagerId'], 'Ce responsable de tribu existe déjà')
	}
}

export const actionFn = async ({ request }: ActionFunctionArgs) => {
	const currentUser = await requireUser(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	invariant(currentUser.churchId, 'Invalid churchId')
	invariant(argonSecretKey, 'ARGON_SECRET_KEY must be defined in .env file')

	const submission = await parseWithZod(formData, {
		schema: createTribeSchema.superRefine(({ name, tribeManagerId }, ctx) => {
			superRefineHandler({ name, tribeManagerId }, ctx)
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return json({
			lastResult: submission.reply(),
			success: false,
			message: null,
		})
	}

	if (intent === 'create') {
		const { membersFile, memberIds, tribeManagerId, password, ...rest } =
			submission.value
		let members: Member[] = []

		const uploadedMembers = await uploadMembers(
			membersFile,
			currentUser.churchId,
		)

		const selectedMembers = await selectMembers(memberIds)

		members = [...uploadedMembers, ...selectedMembers] as Member[]

		const selectedManager = await prisma.user.findUnique({
			where: { id: tribeManagerId },
			include: { tribeManager: true, password: true },
		})

		if (!selectedManager) {
			return json({
				lastResult: submission.reply(),
				success: false,
				message: "Le responsable sélectionné n'existe pas.",
			})
		}

		let managerPassword = selectedManager.password
		let managerRoles = selectedManager.roles

		if (!managerPassword) {
			const hashedPassword = await hash(password, {
				secret: Buffer.from(argonSecretKey),
			})
			managerPassword = {
				hash: hashedPassword,
				userId: tribeManagerId,
			}
		}

		if (!managerRoles.includes(Role.TRIBE_MANAGER)) {
			managerRoles = [...managerRoles, Role.TRIBE_MANAGER]
		}

		prisma.tribe.create({
			data: {
				...rest,
				managerId: tribeManagerId,
				members: {
					connect: members.map(member => ({ id: member.id })),
				},
				churchId: currentUser.churchId,
			},
		})

		return json({
			lastResult: submission.reply(),
			success: true,
			message: 'La tribu a été créee',
		})
	}

	return json({
		lastResult: submission.reply(),
		success: true,
		message: null,
	})
}

async function selectMembers(memberIds: string[] | undefined) {
	if (memberIds && memberIds.length > 0) {
		return await prisma.user.findMany({
			where: { id: { in: memberIds } },
		})
	}
	return []
}

async function uploadMembers(membersFile: File | undefined, churchId: string) {
	let members: Member[] = []
	if (membersFile) {
		const workBook = XLSX.read(await membersFile.arrayBuffer(), {
			type: 'buffer',
			dense: true,
		})

		for (const sheetName of workBook.SheetNames) {
			const sheet = workBook.Sheets[sheetName]
			const { uploadedMembers } = await processSheet(sheet, churchId)

			members = [...members, ...uploadedMembers]
		}
	}
	return members
}

async function processSheet(sheet: XLSX.WorkSheet, churchId: string) {
	const importedData = XLSX.utils.sheet_to_json(sheet)
	const batchSize = 1000

	if (importedData.length === 0) {
		throw new Error('Pas de données dans ce fichier')
	}

	let inserted = 0
	let duplicated = 0
	let uploadedMembers: Member[] = []

	for (let i = 0; i < importedData.length; i += batchSize) {
		const batchData = importedData.slice(i, i + batchSize) as FileData[]

		const validatedData = await validateAndFormatBatch(batchData)
		const { insertedCount, duplicatedCount, members } = await insertBatch(
			validatedData,
			churchId,
		)
		inserted += insertedCount
		duplicated += duplicatedCount
		uploadedMembers = [...members] as Member[]
	}

	return { inserted, duplicated, uploadedMembers }
}

async function validateAndFormatBatch(batchData: FileData[]) {
	return batchData.map(data => {
		const formatedData = {
			name: data['Nom et prénoms'],
			phone: data['Numéro de téléphone'],
			location: data['Localisation'],
		}

		const result = memberSchema.safeParse(formatedData)

		if (!result.success) {
			throw new Error('Les données du fichier ne sont pas valides.')
		}
		return result.data
	})
}

async function insertBatch(batchData: CreateMemberPayload[], churchId: string) {
	let insertedCount = 0
	let duplicatedCount = 0
	let members = []

	for (const data of batchData) {
		const existingMember = await prisma.user.findFirst({
			where: { phone: data.phone },
		})

		if (existingMember) {
			duplicatedCount++
			members.push(existingMember)
		} else {
			const newMember = await prisma.user.create({
				data: {
					...data,
					roles: [Role.MEMBER],
					church: { connect: { id: churchId } },
				},
			})
			insertedCount++

			members.push(newMember)
		}
	}

	return { insertedCount, duplicatedCount, members }
}

export type ActionType = typeof actionFn
