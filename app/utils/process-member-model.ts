import { read, utils } from 'xlsx'
import { PHONE_NUMBER_REGEX } from '../shared/constants'
import { type prisma } from './db.server'

export interface MemberData {
	id?: string
	name: string
	phone: string
	location: string | null
}

type MemberSelectionData = {
	selectionMode: 'manual' | 'file'
	members?: string
	membersFile?: File
}

interface MemberProcessResult {
	data: MemberData[]
	errors: string[]
}

type ExcelRow = {
	'Nom et prénoms': string
	'Numéro de téléphone': string | number
	Localisation: string
}

export async function processExcelFile(
	file: File,
): Promise<MemberProcessResult> {
	const arrayBuffer = await file.arrayBuffer()
	const workbook = read(arrayBuffer, { type: 'array' })

	const sheetName = workbook.SheetNames[0]
	const sheet = workbook.Sheets[sheetName]

	const data = utils.sheet_to_json<ExcelRow>(sheet)

	const memberData = data.map(row => {
		const name = row['Nom et prénoms']
		const phone = row['Numéro de téléphone']
		const location = row['Localisation']

		if (!name || !phone) {
			throw new Error('Invalid file', {
				cause:
					'Données manquantes dans la ligne: nom et numéro de téléphone, sont requis',
			})
		}

		return {
			name: name.trim(),
			phone: phone.toString().trim(),
			location: location?.trim(),
		}
	})

	const uniqueMemberData = memberData.filter(
		(member, index, self) =>
			index === self.findIndex(t => t.phone === member.phone),
	)

	return {
		data: uniqueMemberData,
		errors: validateMemberData(uniqueMemberData),
	}
}

export function validatePhoneNumber(phone: string): boolean {
	return PHONE_NUMBER_REGEX.test(phone)
}

export function validateMemberData(memberData: MemberData[]) {
	const errors: string[] = []

	memberData.forEach((member, index) => {
		if (member.name.length < 2) {
			errors.push(
				`Ligne ${index + 1}: Le nom doit contenir au moins 2 caractères`,
			)
		}
		if (!validatePhoneNumber(member.phone)) {
			errors.push(`Ligne ${index + 1}: Numéro de téléphone invalide`)
		}
		if (member.location && member.location.length < 2) {
			errors.push(
				`Ligne ${index + 1}: La localisation doit contenir au moins 2 caractères`,
			)
		}
	})

	return errors
}

export async function fetchManagerMemberData(
	managerId: string,
	client: typeof prisma,
): Promise<MemberData> {
	const manager = await client.user.findUnique({
		where: { id: managerId },
		select: { name: true, phone: true, location: true },
	})
	return manager!
}

export function removeDuplicateMembers(members: MemberData[]): MemberData[] {
	return Array.from(new Map(members.map(m => [m.phone, m])).values())
}

export async function handleMemberSelection<
	TSelectionData extends MemberSelectionData,
>(data: TSelectionData, client: typeof prisma): Promise<MemberProcessResult> {
	if (data.selectionMode === 'manual' && data.members) {
		const memberIds = JSON.parse(data.members) as string[]
		const members = await client.user.findMany({
			where: { id: { in: memberIds } },
			select: { id: true, name: true, phone: true, location: true },
		})
		return { data: members, errors: [] }
	}
	if (data.selectionMode === 'file' && data.membersFile) {
		return processExcelFile(data.membersFile)
	}
	return { data: [], errors: [] }
}
