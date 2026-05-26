import * as fs from 'fs/promises'
import * as path from 'path'
import ExcelJS, { type Worksheet } from 'exceljs'
import { format, sub } from 'date-fns'
import { fr } from 'date-fns/locale'

import type { MemberMonthlyAttendances } from '~/models/member.model'
import { formatAttendance, getAttendanceFrequence } from '~/shared/attendance'

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

export function applySheetStyle(sheet: Worksheet): void {
	const lastColLetter = sheet.getColumn(sheet.columns.length).letter
	sheet.autoFilter = { from: 'A1', to: `${lastColLetter}1` }
	sheet.views = [{ state: 'frozen', ySplit: 1 }]

	sheet.eachRow((row, rowNumber) => {
		row.eachCell(cell => {
			cell.alignment = { horizontal: 'center', vertical: 'middle' }
			cell.border = CELL_BORDER

			if (rowNumber === 1) styleHeaderCell(cell)
			else styleDataCell(cell)
		})
	})
}

function getColumns(
	data: MemberMonthlyAttendances[],
	currentMonth: Date,
): Partial<ExcelJS.Column>[] {
	const lastMonth = sub(currentMonth, { months: 1 })
	const formattedLastMonth = format(lastMonth, 'MMM yyyy', { locale: fr })
	const formattedCurrentMonth = format(currentMonth, 'MMM yyyy', { locale: fr })
	const sundayAttendances = data[0]?.currentMonthAttendances ?? []

	return [
		{ header: 'Nom & prénoms', key: 'name', width: 50 },
		{ header: 'Téléphone', key: 'phone', width: 25 },
		{ header: 'Email', key: 'email', width: 35 },
		{
			header: `Etat ${formattedLastMonth}`,
			key: 'lastMonthAttendance',
			width: 30,
		},
		...sundayAttendances.map((_, index) => ({
			header: `Dimanche ${index + 1}`,
			key: `sunday${index + 1}`,
			width: 20,
		})),
		{
			header: `Etat ${formattedCurrentMonth}`,
			key: 'currentMonthAttendance',
			width: 30,
		},
	]
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
		...Object.fromEntries(
			member.currentMonthAttendances.map((attendance, index) => [
				`sunday${index + 1}`,
				formatAttendance(attendance.churchPresence),
			]),
		),
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
	const directory = path.resolve('public', 'download')
	await fs.mkdir(directory, { recursive: true })

	const sanitizedName = sheetName
		.toLowerCase()
		.replace(/[^a-z0-9]/gi, '-')
		.replace(/-+/g, '-')

	const timestamp = format(new Date(), 'dd_MM_yyyy_HH_mm_ss')
	const fileName = `${sanitizedName}-${timestamp}.xlsx`

	await fs.writeFile(path.join(directory, fileName), Buffer.from(buffer))

	return `download/${fileName}`
}
