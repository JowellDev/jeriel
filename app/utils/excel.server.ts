import * as fs from 'fs/promises'
import * as path from 'path'
import ExcelJS, { type Worksheet } from 'exceljs'
import { format, sub } from 'date-fns'
import { fr } from 'date-fns/locale'

import type { MemberMonthlyAttendances } from '~/models/member.model'
import { formatAttendance, getAttendanceFrequence } from '~/shared/attendance'
import { MaritalStatusValue } from '~/shared/constants'

interface ExcelRow {
	name: string
	phone: string
	email: string
	lastMonthAttendance: string
	currentMonthAttendance: string
	[sundayKey: `sunday${number}`]: string | number
}

interface CellValueStyle {
	value: string
	fill: ExcelJS.Fill
	font: Partial<ExcelJS.Font>
}

const CELL_BORDER: Partial<ExcelJS.Borders> = {
	top: { style: 'thin' },
	left: { style: 'thin' },
	bottom: { style: 'thin' },
	right: { style: 'thin' },
}

const VALUE_STYLES: CellValueStyle[] = [
	{
		value: 'Présent',
		fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } },
		font: { color: { argb: 'FF006100' } },
	},
	{
		value: 'Absent',
		fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } },
		font: { color: { argb: 'FF9C0006' } },
	},
]

const HEADER_FILL: ExcelJS.Fill = {
	type: 'pattern',
	pattern: 'solid',
	fgColor: { argb: 'FFE3F2FD' },
}

function styleHeaderCell(cell: ExcelJS.Cell): void {
	cell.font = { bold: true }
	cell.fill = HEADER_FILL
}

function styleDataCell(cell: ExcelJS.Cell): void {
	const style = VALUE_STYLES.find(s => s.value === cell.value)

	if (!style) return

	cell.fill = style.fill
	cell.font = style.font
}

function applyCellStyle(cell: ExcelJS.Cell, rowNumber: number): void {
	cell.alignment = { horizontal: 'center', vertical: 'middle' }
	cell.border = CELL_BORDER

	if (rowNumber === 1) styleHeaderCell(cell)
	else styleDataCell(cell)
}

export function applySheetStyle(sheet: Worksheet): void {
	const lastColLetter = sheet.getColumn(sheet.columns.length).letter
	sheet.autoFilter = { from: 'A1', to: `${lastColLetter}1` }
	sheet.views = [{ state: 'frozen', ySplit: 1 }]

	sheet.eachRow((row, rowNumber) => {
		row.eachCell(cell => applyCellStyle(cell, rowNumber))
	})
}

function buildSundayColumns(sundayCount: number): Partial<ExcelJS.Column>[] {
	return Array.from({ length: sundayCount }, (_, i) => ({
		header: `Dimanche ${i + 1}`,
		key: `sunday${i + 1}`,
		width: 20,
	}))
}

function getColumns(
	data: MemberMonthlyAttendances[],
	currentMonth: Date,
): Partial<ExcelJS.Column>[] {
	const lastMonth = sub(currentMonth, { months: 1 })
	const formattedLastMonth = format(lastMonth, 'MMM yyyy', { locale: fr })
	const formattedCurrentMonth = format(currentMonth, 'MMM yyyy', { locale: fr })
	const sundayCount = data[0]?.currentMonthAttendances.length ?? 0

	return [
		{ header: 'Nom & prénoms', key: 'name', width: 50 },
		{ header: 'Téléphone', key: 'phone', width: 25 },
		{ header: 'Email', key: 'email', width: 35 },
		{
			header: `Etat ${formattedLastMonth}`,
			key: 'lastMonthAttendance',
			width: 30,
		},
		...buildSundayColumns(sundayCount),
		{
			header: `Etat ${formattedCurrentMonth}`,
			key: 'currentMonthAttendance',
			width: 30,
		},
	]
}

function buildSundayAttendances(
	attendances: MemberMonthlyAttendances['currentMonthAttendances'],
): Record<string, string> {
	return Object.fromEntries(
		attendances.map((attendance, index) => [
			`sunday${index + 1}`,
			formatAttendance(attendance.churchPresence),
		]),
	)
}

function formatMemberRow(member: MemberMonthlyAttendances): ExcelRow {
	return {
		name: member.name.toLocaleUpperCase(),
		phone: member.phone?.toString() ?? 'N/D',
		email: member.email ?? 'N/D',
		lastMonthAttendance: getAttendanceFrequence({
			attendance: member.previousMonthAttendanceResume,
			withEmoji: false,
		}),
		currentMonthAttendance: getAttendanceFrequence({
			attendance: member.currentMonthAttendanceResume,
			withEmoji: false,
		}),
		...buildSundayAttendances(member.currentMonthAttendances),
	}
}

function sanitizeRowForExcel(row: ExcelRow): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(row).map(([key, value]) => [
			key,
			typeof value === 'bigint' ? Number(value) : (value ?? ''),
		]),
	)
}

function buildMembersFileName(sheetName: string): string {
	const sanitizedName = sheetName
		.toLowerCase()
		.replace(/[^a-z0-9]/gi, '-')
		.replace(/-+/g, '-')

	const timestamp = format(new Date(), 'dd_MM_yyyy_HH_mm_ss')
	return `${sanitizedName}-${timestamp}.xlsx`
}

async function saveExcelBuffer(
	buffer: ArrayBuffer,
	fileName: string,
): Promise<string> {
	const directory = path.resolve('public', 'download')
	await fs.mkdir(directory, { recursive: true })
	await fs.writeFile(path.join(directory, fileName), Buffer.from(buffer))

	return `download/${fileName}`
}

type Gender = 'M' | 'F'
type MaritalStatus = keyof typeof MaritalStatusValue

interface EntityMemberData {
	name: string
	phone: string | null
	email: string | null
	location: string | null
	gender: Gender | null
	birthday: Date | null
	maritalStatus: MaritalStatus | null
}

interface EntityForExport {
	name: string
	manager: { name: string; email: string | null; phone: string | null } | null
	members: EntityMemberData[]
}

interface EntitySummaryRow {
	nom: string
	responsable: string
	telephone: string
	email: string
	nombreFideles: string
}

const GENDER_LABELS: Record<Gender, string> = { M: 'Masculin', F: 'Féminin' }

const ENTITY_SUMMARY_COLUMNS: Partial<ExcelJS.Column>[] = [
	{ header: 'Nom', key: 'nom', width: 40 },
	{ header: 'Nom du responsable', key: 'responsable', width: 35 },
	{ header: 'N° du Responsable', key: 'telephone', width: 25 },
	{ header: 'Email du responsable', key: 'email', width: 35 },
	{ header: 'Nombre de fidèles', key: 'nombreFideles', width: 20 },
]

const ENTITY_MEMBERS_COLUMNS: Partial<ExcelJS.Column>[] = [
	{ header: 'Nom et prénoms', key: 'name', width: 45 },
	{ header: 'Téléphone', key: 'phone', width: 25 },
	{ header: 'Email', key: 'email', width: 35 },
	{ header: 'Localisation', key: 'location', width: 35 },
	{ header: 'Genre', key: 'gender', width: 15 },
	{ header: 'Date de naissance', key: 'birthday', width: 20 },
	{ header: 'Situation matrimoniale', key: 'maritalStatus', width: 25 },
]

function formatEntitySummaryRow(entity: EntityForExport): EntitySummaryRow {
	return {
		nom: entity.name.toLocaleUpperCase(),
		responsable: entity.manager?.name ?? 'N/D',
		telephone: entity.manager?.phone ?? 'N/D',
		email: entity.manager?.email ?? 'N/D',
		nombreFideles: entity.members.length.toString(),
	}
}

function formatEntityMemberRow(
	member: EntityMemberData,
): Record<string, string> {
	return {
		name: member.name.toLocaleUpperCase(),
		phone: member.phone ?? 'N/D',
		email: member.email ?? 'N/D',
		location: member.location ?? 'N/D',
		gender: member.gender ? GENDER_LABELS[member.gender] : 'N/D',
		birthday: member.birthday ? format(member.birthday, 'dd/MM/yyyy') : 'N/D',
		maritalStatus: member.maritalStatus
			? MaritalStatusValue[member.maritalStatus]
			: 'N/D',
	}
}

function sanitizeSheetName(name: string): string {
	return name
		.replace(/[/\\*?:[\]]/g, '')
		.substring(0, 31)
		.trim()
}

function addEntityMembersSheet(
	workbook: ExcelJS.Workbook,
	entity: EntityForExport,
): void {
	const sheet = workbook.addWorksheet(sanitizeSheetName(entity.name))
	sheet.columns = ENTITY_MEMBERS_COLUMNS
	entity.members.forEach(member => sheet.addRow(formatEntityMemberRow(member)))

	applySheetStyle(sheet)
}

function createEntityWorkbook(
	summarySheetName: string,
	data: EntityForExport[],
): ExcelJS.Workbook {
	const workbook = new ExcelJS.Workbook()
	const summarySheet = workbook.addWorksheet(summarySheetName)

	summarySheet.columns = ENTITY_SUMMARY_COLUMNS
	data.forEach(entity => summarySheet.addRow(formatEntitySummaryRow(entity)))
	applySheetStyle(summarySheet)

	data.forEach(entity => addEntityMembersSheet(workbook, entity))

	return workbook
}

export async function createDepartmentsExcelFile(
	data: EntityForExport[],
): Promise<string> {
	const workbook = createEntityWorkbook('Départements', data)
	const buffer = await workbook.xlsx.writeBuffer()
	return saveExcelBuffer(buffer, buildMembersFileName('Départements'))
}

export async function createTribesExcelFile(
	data: EntityForExport[],
): Promise<string> {
	const workbook = createEntityWorkbook('Tribus', data)
	const buffer = await workbook.xlsx.writeBuffer()
	return saveExcelBuffer(buffer, buildMembersFileName('Tribus'))
}

export async function createHonorFamiliesExcelFile(
	data: EntityForExport[],
): Promise<string> {
	const workbook = createEntityWorkbook("Familles d'Honneur", data)
	const buffer = await workbook.xlsx.writeBuffer()
	return saveExcelBuffer(buffer, buildMembersFileName("Familles d'Honneur"))
}

export async function createMembersExcelFile(
	data: MemberMonthlyAttendances[],
	currentMonth: Date,
	sheetName: string,
): Promise<string> {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet(sheetName)

	sheet.columns = getColumns(data, currentMonth)

	data.forEach(member =>
		sheet.addRow(sanitizeRowForExcel(formatMemberRow(member))),
	)

	applySheetStyle(sheet)

	const buffer = await workbook.xlsx.writeBuffer()

	return saveExcelBuffer(buffer, buildMembersFileName(sheetName))
}
