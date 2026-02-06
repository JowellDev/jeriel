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
			phone: `${data['Numéro de téléphone']}`,
			location: data['Localisation'],
			birthday: new Date(data['Date de naissance']),
			gender: data['Genre'],
			maritalStatus: data['Situation Matrimoniale'],
		}

		const result = MEMBER_SCHEMA.safeParse(formatedData)

		if (!result.success) {
			throw new Error('Les données du fichier ne sont pas valides.')
		}

		return result.data
	})
}

async function insertBatch(batchData: CreateMemberInput[], churchId: string) {
	let insertedCount = 0
	let duplicatedCount = 0
	const members = []

	for (const data of batchData) {
		// Chercher d'abord par téléphone, puis par nom si pas trouvé
		let existingMember = data.phone
			? await prisma.user.findFirst({
					where: { phone: data.phone, churchId },
				})
			: null

		if (!existingMember) {
			existingMember = await prisma.user.findFirst({
				where: { name: data.name, churchId },
			})
		}

		if (existingMember) {
			// Mettre à jour les informations si trouvé
			await prisma.user.update({
				where: { id: existingMember.id },
				data: {
					phone: data.phone || existingMember.phone,
					location: data.location || existingMember.location,
				},
			})
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
