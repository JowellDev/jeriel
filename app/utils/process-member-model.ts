import { read, utils } from 'xlsx'
import { MaritalStatusValue, PHONE_NUMBER_REGEX } from '../shared/constants'
import { type prisma } from './db.server'
import { Gender, type MaritalStatus, type Prisma } from '@prisma/client'

const MEMBER_SELECT = {
	name: true,
	phone: true,
	location: true,
	maritalStatus: true,
	gender: true,
	birthday: true,
	honorFamily: {
		select: { name: true },
	},
	tribe: {
		select: { name: true },
	},
	department: {
		select: { name: true },
	},
} as Prisma.UserSelect

export interface MemberData {
	id?: string
	name: string
	phone: string
	location: string | null
	gender: Gender | null
	birthday: Date | null
	maritalStatus: string | null
	honorFamily: string | null
	department: string | null
	tribe: string | null
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
	'Numéro de téléphone': string
	Localisation: string
	Genre: string
	'Date de naissance': string
	'Situation matrimoniale': string
	"Famille d'honneur": string
	Tribu: string
	Département: string
}

type Column = {
	property: keyof MemberData
	accessorKey: keyof ExcelRow
}

export async function processExcelFile(
	file: File,
): Promise<MemberProcessResult> {
	const arrayBuffer = await file.arrayBuffer()
	const workbook = read(arrayBuffer, { type: 'array' })

	const sheetName = workbook.SheetNames[0]
	const sheet = workbook.Sheets[sheetName]

	const data = utils.sheet_to_json<ExcelRow>(sheet)

	const members = extractMembers(data)

	const uniqueMembers = members.filter(
		(member, index, self) =>
			index === self.findIndex(t => t.phone === member.phone),
	)

	return {
		data: uniqueMembers,
		errors: validateMembers(uniqueMembers),
	}
}

function extractMembers(rows: ExcelRow[]): MemberData[] {
	const members: MemberData[] = []

	for (const row of rows) {
		const member = extractRowData(row)
		const { maritalStatus, gender, ...rest } = member

		if (!member.name || !member.phone) continue

		members.push({
			...rest,
			maritalStatus: getMaritalStatusValue(maritalStatus),
			gender: [Gender.F, Gender.M, null].includes(gender) ? gender : null,
		})
	}

	return members
}

function extractRowData(row: ExcelRow): MemberData {
	const columns = getColumns()
	const result = {} as MemberData

	for (const { property, accessorKey } of columns) {
		const rawValue = row[accessorKey]
		const value =
			!rawValue || rawValue === '' ? null : rawValue.toString().trim()

		result[property] = value as any
	}

	return result
}

function getColumns(): Column[] {
	return [
		{ property: 'name', accessorKey: 'Nom et prénoms' },
		{ property: 'phone', accessorKey: 'Numéro de téléphone' },
		{ property: 'location', accessorKey: 'Localisation' },
		{ property: 'gender', accessorKey: 'Genre' },
		{ property: 'birthday', accessorKey: 'Date de naissance' },
		{ property: 'maritalStatus', accessorKey: 'Situation matrimoniale' },
		{ property: 'honorFamily', accessorKey: "Famille d'honneur" },
		{ property: 'tribe', accessorKey: 'Tribu' },
		{ property: 'department', accessorKey: 'Département' },
	]
}

export function validatePhoneNumber(phone: string): boolean {
	return PHONE_NUMBER_REGEX.test(phone)
}

export function validateMembers(members: MemberData[]) {
	const errors: string[] = []

	members.forEach((member, index) => {
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
		select: MEMBER_SELECT,
	})

	if (!manager) {
		throw new Error('Responsable introuvable')
	}

	return formatMemberData(manager)
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
			select: MEMBER_SELECT,
		})

		return { data: members.map(formatMemberData), errors: [] }
	}

	if (data.selectionMode === 'file' && data.membersFile) {
		return processExcelFile(data.membersFile)
	}

	return { data: [], errors: [] }
}

function formatMemberData(
	member: Prisma.UserGetPayload<{ select: typeof MEMBER_SELECT }>,
): MemberData {
	return {
		name: member.name,
		phone: member.phone,
		location: member.location,
		maritalStatus: member.maritalStatus,
		gender: member.gender,
		birthday: member.birthday,
		honorFamily: member.honorFamily ? member.honorFamily.name : null,
		tribe: member.tribe ? member.tribe.name : null,
		department: member.department ? member.department.name : null,
	}
}

function getMaritalStatusValue(
	maritalStatusValue: string | null,
): MaritalStatus | null {
	return !maritalStatusValue
		? null
		: ((Object.entries(MaritalStatusValue).find(
				([_, value]) => value === maritalStatusValue,
			)?.[0] as MaritalStatus) ?? null)
}
