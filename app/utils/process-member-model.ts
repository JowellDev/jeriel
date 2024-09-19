import { read, utils } from 'xlsx'
import { PHONE_NUMBER_REGEX } from '../shared/constants'

export interface MemberData {
	name: string
	phone: string
	location: string
}

export async function processExcelFile(file: File): Promise<MemberData[]> {
	const arrayBuffer = await file.arrayBuffer()
	const workbook = read(arrayBuffer, { type: 'array' })

	const sheetName = workbook.SheetNames[0]
	const sheet = workbook.Sheets[sheetName]

	const data = utils.sheet_to_json(sheet)

	const memberData = data.map((row: any) => {
		const name = row['Nom et prénoms']

		const phone = row['Numéro de Téléphone']

		const location = row['Localisation']

		if (!name || !phone || !location) {
			throw new Error(
				'Données manquantes dans la ligne: nom, numéro de téléphone, et localisation sont requis',
			)
		}

		return {
			name: name.trim(),
			phone: phone.toString().trim(),
			location: location.trim(),
		}
	})

	const uniqueMemberData = memberData.filter(
		(member, index, self) =>
			index === self.findIndex(t => t.phone === member.phone),
	)

	return uniqueMemberData
}

export function validatePhoneNumber(phone: string): boolean {
	return PHONE_NUMBER_REGEX.test(phone)
}

export function validateMemberData(memberData: MemberData[]): {
	isValid: boolean
	errors: string[]
} {
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
		if (member.location.length < 2) {
			errors.push(
				`Ligne ${index + 1}: La localisation doit contenir au moins 2 caractères`,
			)
		}
	})

	return {
		isValid: errors.length === 0,
		errors,
	}
}
