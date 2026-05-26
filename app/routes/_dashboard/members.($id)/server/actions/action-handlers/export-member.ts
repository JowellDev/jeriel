import { parseWithZod } from '@conform-to/zod'
import { type AuthenticatedUser } from '~/utils/auth.server'
import { filterSchema } from '../../../schema'
import invariant from 'tiny-invariant'
import { getFilterOptions } from '../../../utils'
import { type Prisma } from '@prisma/client'
import { prisma } from '~/infrastructures/database/prisma.server'
import { getMonthSundays } from '~/utils/date'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'

import * as fs from 'fs/promises'
import * as path from 'path'

import ExcelJS, { Worksheet } from 'exceljs'
import { format, sub } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatAttendance, getAttendanceFrequence } from '~/shared/attendance'

export async function exportMembers(
	request: Request,
	currentUser: AuthenticatedUser,
) {
	const submission = parseWithZod(new URL(request.url).searchParams, {
		schema: filterSchema,
	})

	invariant(submission.status === 'success', 'params must be defined')

	const where = getFilterOptions(submission.value, currentUser)

	const members = await getExportMembers(where)

	const timestamp = format(new Date(), 'dd_MM_yyyy_HH_mm_ss')

	const fileLink = await createFile(
		members,
		`liste-des-membres-${timestamp}.xlsx`,
	)

	return { status: 'success', fileLink }
}

function getMembersExportAttendances(
	members: Member[],
): MemberMonthlyAttendances[] {
	const currentMonthSundays = getMonthSundays(new Date())

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
				date: new Date(),
				meetingPresence: null,
				hasConflict: false,
			},
		],
	}))
}

export async function getExportMembers(
	where: Prisma.UserWhereInput,
): Promise<MemberMonthlyAttendances[]> {
	const members = await prisma.user.findMany({
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

	return getMembersExportAttendances(members)
}

interface ExcelRow {
	name: string
	phone: string
	email: string
	lastMonthAttendance: string
	currentMonthAttendance: string
	[sundayKey: `sunday${number}`]: string | number
}

async function createFile<T extends MemberMonthlyAttendances>(
	data: T[],
	fileName: string,
) {
	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('Liste des membres')

	const columns = getColumns(data, new Date())

	configureSheet(sheet, columns)
	addMembersRows(sheet, data)
	applySheetStyle(sheet)

	const buffer = await workbook.xlsx.writeBuffer()

	const directory = path.resolve('public', 'download')

	const filePath = path.join(directory, fileName)

	await fs.writeFile(filePath, Buffer.from(buffer))

	return `download/${fileName}`
}

function configureSheet(
	sheet: ExcelJS.Worksheet,
	columns: Partial<ExcelJS.Column>[],
) {
	sheet.columns = columns
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
		{ header: 'Téléphone', key: 'phone', width: 50 },
		{ header: 'Email', key: 'email', width: 50 },
		{
			header: `Etat ${formattedLastMonth}`,
			key: 'lastMonthAttendance',
			width: 70,
		},
		...sundayAttendances.map((_, index) => ({
			header: `Dimanche ${index + 1}`,
			key: `sunday${index + 1}`,
			width: 70,
		})),
		{
			header: `Etat ${formattedCurrentMonth}`,
			key: 'currentMonthAttendance',
			width: 70,
		},
	]
}

function addMembersRows(
	sheet: ExcelJS.Worksheet,
	members: MemberMonthlyAttendances[],
): void {
	const rows = members.map(formatConsumptionRow)
	rows.forEach(row => sheet.addRow(sanitizeRowForExcel(row)))
}

function formatConsumptionRow(member: MemberMonthlyAttendances): ExcelRow {
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

export function applySheetStyle(sheet: Worksheet): void {
	const lastColLetter = sheet.getColumn(sheet.columns.length).letter
	sheet.autoFilter = { from: 'A1', to: `${lastColLetter}1` }
	sheet.views = [{ state: 'frozen', ySplit: 1 }]

	sheet.eachRow((row, rowNumber) => {
		row.eachCell(cell => {
			cell.alignment = { horizontal: 'center', vertical: 'middle' }

			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' },
			}

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
