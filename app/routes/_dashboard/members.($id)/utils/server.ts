import type { Prisma, User } from '@prisma/client'
import type { MemberExportedData, MemberFilterOptions } from '../types'
import { normalizeDate, getMonthSundays } from '~/utils/date'
import { MemberStatus } from '~/shared/enum'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { prisma } from '~/utils/db.server'
import { format } from 'date-fns'

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
	return await prisma.user.findMany({
		where,
		select: {
			name: true,
			phone: true,
			location: true,
			createdAt: true,
		},
	})
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
