import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { paramsSchema } from '../schema'
import { prisma } from '~/infrastructures/database/prisma.server'
import type { GetMembersData } from '../types'
import { getDateFilterOptions } from '~/utils/attendance.server'
import { type Prisma } from '@prisma/client'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { getMonthSundays } from '~/utils/date'
import { transformMembersDataForExport } from '~/shared/attendance'
import { createFile } from '~/utils/xlsx.server'

export function getUrlParams(request: Request) {
	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, {
		schema: paramsSchema,
	})

	invariant(submission.status === 'success', 'invalid criteria')

	return submission.value
}

export async function getTribeName(id: string) {
	return await prisma.tribe.findFirst({
		where: { id },
		select: { name: true },
	})
}

export async function getExportTribeMembers({
	id,
	filterData,
}: GetMembersData) {
	const where = buildUserWhereInput({ id, filterData })

	const members = await prisma.user.findMany({
		where,
		select: {
			id: true,
			integrationDate: true,
			name: true,
			email: true,
			phone: true,
			location: true,
			createdAt: true,
			isAdmin: true,
			pictureUrl: true,
			gender: true,
			birthday: true,
			maritalStatus: true,
		},
	})
	return getMembersAttendances(members)
}

export function getMembersAttendances(
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

export function buildUserWhereInput({
	id,
	filterData,
}: GetMembersData): Prisma.UserWhereInput {
	const { query } = filterData
	const contains = `%${query.replace(/ /g, '%')}%`

	return {
		tribeId: id,
		isActive: true,
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
		...getDateFilterOptions(filterData),
	} satisfies Prisma.UserWhereInput
}

export async function createExportTribeMembersFile({
	fileName,
	customerName,
	members,
}: {
	fileName: string
	customerName: string
	members: MemberMonthlyAttendances[]
}) {
	const safeRows = transformMembersDataForExport(members)

	const fileLink = await createFile({
		safeRows,
		feature: 'Membres de tribu',
		fileName,
		customerName,
	})

	return '/' + fileLink
}
