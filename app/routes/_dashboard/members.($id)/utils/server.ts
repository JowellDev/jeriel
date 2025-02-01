import type { Prisma, User } from '@prisma/client'
import type {
	ExportMemberFileParams,
	MemberExportedData,
	MemberFilterOptions,
} from '../types'
import { normalizeDate, getMonthSundays } from '~/utils/date'
import { MemberStatus } from '~/shared/enum'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { prisma } from '~/utils/db.server'
import { format, sub } from 'date-fns'
import { createFile } from '~/utils/xlsx.server'
import { fr } from 'date-fns/locale'

export function getFilterOptions(
	paramsData: MemberFilterOptions,
	currentUser: User,
	isExporting = false,
): Prisma.UserWhereInput {
	const params = formatOptions(paramsData)
	const { tribeId, departmentId, honorFamilyId } = params

	const contains = `%${params.query.replace(/ /g, '%')}%`

	return {
		...(isExporting ? {} : { id: { not: currentUser.id } }),
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
		churchId: currentUser.churchId,
		...(tribeId && { tribeId }),
		...(departmentId && { departmentId }),
		...(honorFamilyId && { honorFamilyId }),
		...getDateFilterOptions(params),
	} satisfies Prisma.UserWhereInput
}

export function getMembersAttendances(
	members: Member[],
): MemberMonthlyAttendances[] {
	const currentMonthSundays = getMonthSundays(new Date())
	return members.map(member => ({
		...member,
		previousMonthAttendanceResume: null,
		currentMonthAttendanceResume: null,
		currentMonthAttendances: currentMonthSundays.map(sunday => ({
			sunday,
			isPresent: null,
		})),
	}))
}

export async function getExportMembers(where: Prisma.UserWhereInput) {
	return getMembersAttendances(
		await prisma.user.findMany({
			where,
			select: {
				id: true,
				integrationDate: true,
				name: true,
				phone: true,
				location: true,
				createdAt: true,
			},
		}),
	)
}

export function getDataRows(
	members: MemberExportedData[],
): Record<string, string>[] {
	return members.map(m => ({
		Nom: m.name,
		'N°. téléphone': m.phone,
		Localisation: m.location ?? '',
		"Date d'ajout": format(m.createdAt, 'dd/MM/yyyy'),
	}))
}

function getDateFilterOptions(options: MemberFilterOptions) {
	const { status, to, from } = options

	const isAll = status === 'ALL'
	const statusEnabled = !!status && !isAll
	const isNew = status === MemberStatus.NEW

	const startDate = normalizeDate(new Date(from), 'start')
	const endDate = normalizeDate(new Date(to), 'end')

	return {
		...(!statusEnabled && { createdAt: { lte: endDate } }),
		...(statusEnabled
			? {
					createdAt: isNew
						? { gte: startDate, lte: endDate }
						: { lte: startDate },
				}
			: { createdAt: { lte: endDate } }),
	}
}

function formatOptions(options: MemberFilterOptions) {
	let filterOptions: any = {}

	for (const [key, value] of Object.entries(options)) {
		filterOptions[key] = value.toLocaleString() === 'ALL' ? undefined : value
	}

	return filterOptions
}

function calculateMonthStatus(member: MemberMonthlyAttendances): string {
	if (!member.currentMonthAttendanceResume) return '-'

	const { attendance, sundays } = member.currentMonthAttendanceResume
	const percentage = (attendance / sundays) * 100

	if (percentage >= 75) return 'Régulier'
	if (percentage >= 50) return 'Irrégulier'
	return 'Absent'
}

function formatAttendance(isPresent: boolean | null): string {
	if (isPresent === true) return 'P'
	if (isPresent === false) return 'A'
	return '-'
}

function transformDataForExport(
	members: MemberMonthlyAttendances[],
): Record<string, string>[] {
	const currentMonth = new Date()
	const lastMonth = sub(currentMonth, { months: 1 })

	return members.map(member => {
		const row: Record<string, string> = {
			'Nom & prénoms': member.name,
			Téléphone: member.phone,
		}

		const lastMonthKey = `Etat ${format(lastMonth, 'MMM yyyy', { locale: fr })}`
		row[lastMonthKey] = member.previousMonthAttendanceResume
			? calculateMonthStatus({
					...member,
					currentMonthAttendanceResume: member.previousMonthAttendanceResume,
				})
			: '-'

		member.currentMonthAttendances.forEach((attendance, index) => {
			row[`D${index + 1}`] = formatAttendance(attendance.isPresent)
		})

		row['Etat du mois'] = calculateMonthStatus(member)

		return row
	})
}

export async function createMemberFile({
	feature,
	members,
	customerName,
}: ExportMemberFileParams) {
	const safeRows = transformDataForExport(members)

	return await createFile({
		feature,
		safeRows,
		customerName,
	})
}
