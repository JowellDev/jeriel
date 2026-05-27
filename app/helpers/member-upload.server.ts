import { Role } from '@prisma/client'
import * as XLSX from 'xlsx'
import { MEMBER_SCHEMA } from '~/shared/constants'
import { prisma } from '~/infrastructures/database/prisma.server'

interface Member {
	id: string
	name: string
	phone: string
	location: string
	createdAt: Date
}

interface CreateMemberInput {
	name: string
	phone: string
	location: string
}

interface FileData {
	[key: string]: string
}

export async function uploadMembers(
	membersFile: File | undefined,
	churchId: string,
) {
	let members: Member[] = []

	if (!membersFile) return members

	const workBook = XLSX.read(await membersFile.arrayBuffer(), {
		type: 'buffer',
		dense: true,
	})

	for (const sheetName of workBook.SheetNames) {
		const sheet = workBook.Sheets[sheetName]

		const { uploadedMembers } = await processSheet(sheet, churchId)

		members = [...members, ...uploadedMembers]
	}

	return members
}

async function processSheet(sheet: XLSX.WorkSheet, churchId: string) {
	const importedData = XLSX.utils.sheet_to_json(sheet) as FileData[]

	if (importedData.length === 0)
		throw new Error('Pas de données dans ce fichier')

	return processBatches(importedData, churchId, 1000)
}

async function processBatches(
	importedData: FileData[],
	churchId: string,
	batchSize: number,
) {
	let inserted = 0
	let duplicated = 0
	let uploadedMembers: Member[] = []

	for (let i = 0; i < importedData.length; i += batchSize) {
		const batch = importedData.slice(i, i + batchSize)
		const validatedData = await validateAndFormatBatch(batch)
		const result = await insertBatch(validatedData, churchId)
		inserted += result.insertedCount
		duplicated += result.duplicatedCount
		uploadedMembers = [...result.members] as Member[]
	}

	return { inserted, duplicated, uploadedMembers }
}

function formatRawMember(data: FileData) {
	return {
		name: data['Nom et prénoms'],
		phone: `${data['Numéro de téléphone']}`,
		location: data['Localisation'],
		birthday: new Date(data['Date de naissance']),
		gender: data['Genre'],
		maritalStatus: data['Situation Matrimoniale'],
	}
}

function validateMemberData(data: FileData) {
	const formatted = formatRawMember(data)
	const result = MEMBER_SCHEMA.safeParse(formatted)
	if (!result.success)
		throw new Error('Les données du fichier ne sont pas valides.')
	return result.data
}

async function validateAndFormatBatch(batchData: FileData[]) {
	return batchData.map(validateMemberData)
}

async function findExistingMember(data: CreateMemberInput, churchId: string) {
	if (data.phone) {
		const byPhone = await prisma.user.findFirst({
			where: { phone: data.phone, churchId },
		})
		if (byPhone) return byPhone
	}
	return prisma.user.findFirst({ where: { name: data.name, churchId } })
}

async function updateMember(
	id: string,
	data: CreateMemberInput,
	existing: { phone: string | null; location: string | null },
) {
	return prisma.user.update({
		where: { id },
		data: {
			phone: data.phone || existing.phone,
			location: data.location || existing.location,
		},
	})
}

async function createMember(data: CreateMemberInput, churchId: string) {
	return prisma.user.create({
		data: {
			...data,
			roles: [Role.MEMBER],
			church: { connect: { id: churchId } },
		},
	})
}

async function upsertMember(data: CreateMemberInput, churchId: string) {
	const existing = await findExistingMember(data, churchId)
	if (existing) {
		await updateMember(existing.id, data, existing)
		return { member: existing, isDuplicate: true }
	}
	const member = await createMember(data, churchId)
	return { member, isDuplicate: false }
}

async function insertBatch(batchData: CreateMemberInput[], churchId: string) {
	let insertedCount = 0
	let duplicatedCount = 0
	const members = []

	for (const data of batchData) {
		const { member, isDuplicate } = await upsertMember(data, churchId)
		if (isDuplicate) duplicatedCount++
		else insertedCount++

		members.push(member)
	}

	return { insertedCount, duplicatedCount, members }
}
