import type { Prisma, User } from '@prisma/client'
import type { ExportMemberFileParams, MemberFilterOptions } from '../types'
import { normalizeDate, getMonthSundays } from '~/utils/date'
import { MemberStatus } from '~/shared/enum'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { prisma } from '~/infrastructures/database/prisma.server'
import { createFile } from '~/utils/xlsx.server'
import { transformMembersDataForExport } from '~/shared/attendance'

export function getFilterOptions(
	paramsData: MemberFilterOptions,
	currentUser: User,
): Prisma.UserWhereInput {
	const params = formatOptions(paramsData)
	const { tribeId, departmentId, honorFamilyId } = params

	const contains = `%${params.query.replace(/ /g, '%')}%`

	return {
		OR: [
			{ name: { contains, mode: 'insensitive' } },
			{ email: { contains, mode: 'insensitive' } },
			{ phone: { contains } },
		],
		churchId: currentUser.churchId,
		...(tribeId && { tribeId }),
		...(departmentId && { departmentId }),
		...(honorFamilyId && { honorFamilyId }),
		...getDateFilterOptions(params),
	} satisfies Prisma.UserWhereInput
}

export function getMembersExportAttendances(
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

export async function getExportMembers(where: Prisma.UserWhereInput) {
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
	})

	return getMembersExportAttendances(members)
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
	const filterOptions: any = {}

	for (const [key, value] of Object.entries(options)) {
		filterOptions[key] = value.toLocaleString() === 'ALL' ? undefined : value
	}

	return filterOptions
}

export async function createMemberFile({
	feature,
	members,
	customerName,
}: ExportMemberFileParams) {
	const safeRows = transformMembersDataForExport(members)

	return await createFile({
		feature,
		safeRows,
		customerName,
	})
}
