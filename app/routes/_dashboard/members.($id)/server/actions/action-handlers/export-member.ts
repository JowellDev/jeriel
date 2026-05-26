import { parseWithZod } from '@conform-to/zod'
import * as fs from 'fs/promises'
import * as path from 'path'
import ExcelJS, { type Worksheet } from 'exceljs'
import { format, sub } from 'date-fns'
import { fr } from 'date-fns/locale'
import invariant from 'tiny-invariant'
import { type Prisma } from '@prisma/client'

import { type AuthenticatedUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import { getMonthSundays } from '~/utils/date'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { formatAttendance, getAttendanceFrequence } from '~/shared/attendance'

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

	const currentMonth = new Date(submission.value.to)

	const where = getFilterOptions(submission.value, currentUser)

	const members = await getMembers(where)
	const formatedMembers = getMembersExportAttendances(members, currentMonth)

	const fileLink = await createFile(formatedMembers, currentMonth)

	return { status: 'success', fileLink }
}

function getMembersExportAttendances(
	members: Member[],
	currentMonth: Date,
): MemberMonthlyAttendances[] {
	const currentMonthSundays = getMonthSundays(currentMonth)

	return members.map(member => ({
		...member,
		previousMonthAttendanceResume: null,
		currentMonthAttendanceResume: null,
		previousMonthMeetingResume: null,
		currentMonthMeetingResume: null,
		currentMonthAttendances: currentMonthSundays.map(sunday => ({
			sunday,
			churchPresence: null,
			servicePresence: null,
			meetingPresence: null,
			hasConflict: false,
		})),
		currentMonthMeetings: [
			{
				date: currentMonth,
				meetingPresence: null,
				hasConflict: false,
			},
		],
	}))
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
	const width = 40
	const lastMonth = sub(currentMonth, { months: 1 })

	const formattedLastMonth = format(lastMonth, 'MMM yyyy', { locale: fr })
	const formattedCurrentMonth = format(currentMonth, 'MMM yyyy', { locale: fr })
	const sundayAttendances = data[0]?.currentMonthAttendances ?? []

	return [
		{ header: 'Nom & prénoms', key: 'name', width },
		{ header: 'Téléphone', key: 'phone', width },
		{ header: 'Email', key: 'email', width },
		{
			header: `Etat ${formattedLastMonth}`,
			key: 'lastMonthAttendance',
			width,
		},
		...sundayAttendances.map((_, index) => ({
			header: `Dimanche ${index + 1}`,
			key: `sunday${index + 1}`,
			width,
		})),
		{
			header: `Etat ${formattedCurrentMonth}`,
			key: 'currentMonthAttendance',
			width,
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
		name: member.name,
		phone: member.phone ?? 'N/D',
		email: member.email ?? 'N/D',
		lastMonthAttendance: getAttendanceFrequence(
			member.previousMonthAttendanceResume,
		),
		currentMonthAttendance: getAttendanceFrequence(
			member.currentMonthAttendanceResume,
		),
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

export function applySheetStyle(sheet: Worksheet): void {
	const lastColLetter = sheet.getColumn(sheet.columns.length).letter
	sheet.autoFilter = { from: 'A1', to: `${lastColLetter}1` }
	sheet.views = [{ state: 'frozen', ySplit: 1 }]

	sheet.eachRow((row, rowNumber) => {
		row.eachCell(cell => {
			cell.alignment = { horizontal: 'center', vertical: 'middle' }
			cell.border = CELL_BORDER

			if (rowNumber === 1) {
				cell.font = { bold: true }
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'FFE3F2FD' },
				}
			}
		})
	})
}
