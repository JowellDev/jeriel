import { parseWithZod } from '@conform-to/zod'
import * as fs from 'fs/promises'
import * as path from 'path'
import ExcelJS, { type Worksheet } from 'exceljs'
import { format, sub, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import invariant from 'tiny-invariant'
import { type Prisma } from '@prisma/client'

import { type AuthenticatedUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import {
	formatAttendance,
	getAttendanceFrequence,
	getMembersAttendances,
} from '~/shared/attendance'
import {
	prepareDateRanges,
	fetchAttendanceData,
} from '~/helpers/attendance.server'

import { filterSchema } from '../../../schema'
import { getFilterOptions } from '../../../utils'

export async function exportMembers(
	request: Request,
	currentUser: AuthenticatedUser,
) {
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const { value } = submission
	const fromDate = parseISO(value.from)
	const toDate = parseISO(value.to)

	const {
		toDate: processedToDate,
		currentMonthSundays,
		previousMonthSundays,
		previousFrom,
		previousTo,
	} = prepareDateRanges(toDate)

	const where = getFilterOptions(value, currentUser)
	const members = await getMembers(where)
	const memberIds = members.map(m => m.id)

	const { allAttendances, previousAttendances } = await fetchAttendanceData(
		currentUser,
		memberIds,
		fromDate,
		processedToDate,
		previousFrom,
		previousTo,
	)

	const membersWithAttendances = getMembersAttendances(
		members,
		currentMonthSundays,
		previousMonthSundays,
		allAttendances,
		previousAttendances,
	)

	const fileLink = await createFile(membersWithAttendances, toDate)

	return { status: 'success', fileLink }
}

export async function getMembers(
	where: Prisma.UserWhereInput,
): Promise<Member[]> {
	return prisma.user.findMany({
		where,
		select: {
			id: true,
			integrationDate: true,
			birthday: true,
			name: true,
			email: true,
			phone: true,
			location: true,
			createdAt: true,
			gender: true,
			maritalStatus: true,
			pictureUrl: true,
		},
		orderBy: { name: 'asc' },
	})
}

interface ExcelRow {
	name: string
	phone: string
	email: string
	lastMonthAttendance: string
	currentMonthAttendance: string
	[sundayKey: `sunday${number}`]: string | number
}

async function createFile(
	data: MemberMonthlyAttendances[],
	currentMonth: Date,
): Promise<string> {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('Liste des membres')

	sheet.columns = getColumns(data, currentMonth)
	addMembersRows(sheet, data)
	applySheetStyle(sheet)

	const buffer = await workbook.xlsx.writeBuffer()

	const directory = path.resolve('public', 'download')

	await fs.mkdir(directory, { recursive: true })

	const timestamp = format(new Date(), 'dd_MM_yyyy_HH_mm_ss')

	const fileName = `liste-des-membres-${timestamp}.xlsx`

	const filePath = path.join(directory, fileName)

	await fs.writeFile(filePath, Buffer.from(buffer))

	return `download/${fileName}`
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

function addMembersRows(
	sheet: ExcelJS.Worksheet,
	members: MemberMonthlyAttendances[],
): void {
	members.forEach(member =>
		sheet.addRow(sanitizeRowForExcel(formatMemberRow(member))),
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
		...Object.fromEntries(
			member.currentMonthAttendances.map((attendance, index) => [
				`sunday${index + 1}`,
				formatAttendance(attendance.churchPresence),
			]),
		),
	}
}

function sanitizeRowForExcel(row: ExcelRow): Record<string, any> {
	return Object.fromEntries(
		Object.entries(row).map(([key, value]) => [
			key,
			typeof value === 'bigint' ? Number(value) : (value ?? ''),
		]),
	)
}

const CELL_BORDER: Partial<ExcelJS.Borders> = {
	top: { style: 'thin' },
	left: { style: 'thin' },
	bottom: { style: 'thin' },
	right: { style: 'thin' },
}

interface CellValueStyle {
	value: string
	fill: ExcelJS.Fill
	font: Partial<ExcelJS.Font>
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

function styleDataCell(cell: ExcelJS.Cell): void {
	const style = VALUE_STYLES.find(s => s.value === cell.value)

	if (!style) return

	cell.fill = style.fill
	cell.font = style.font
}

function styleHeaderCell(cell: ExcelJS.Cell): void {
	cell.font = { bold: true }
	cell.fill = HEADER_FILL
}
