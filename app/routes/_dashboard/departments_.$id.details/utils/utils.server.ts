import { parseWithZod } from '@conform-to/zod'
import invariant from 'tiny-invariant'
import { paramsSchema } from '../schema'
import { prisma } from '~/infrastructures/database/prisma.server'
import { getDateFilterOptions } from '~/helpers/attendance.server'
import { type Prisma } from '@prisma/client'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { getMonthSundays } from '~/utils/date'
import { transformMembersDataForExport } from '~/shared/attendance'
import { createFile } from '~/utils/xlsx.server'

export function getUrlParams(request: Request) {
	const url = new URL(request.url)
	const submission = parseWithZod(url.searchParams, { schema: paramsSchema })

	invariant(submission.status === 'success', 'invalid criteria')

	return submission.value
}

export async function getDepartmentName(id: string) {
	return prisma.department.findFirst({
		where: { id },
		select: { name: true },
	})
}

export async function getExportDepartmentMembers({
	id,
	filterData,
}: {
	id: string
	filterData: ReturnType<typeof getUrlParams>
}) {
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

function buildUserWhereInput({
	id,
	filterData,
}: {
	id: string
	filterData: ReturnType<typeof getUrlParams>
}): Prisma.UserWhereInput {
	const { query } = filterData
	const contains = `%${query.replace(/ /g, '%')}%`

	return {
		departmentId: id,
		isActive: true,
		OR: [{ name: { contains, mode: 'insensitive' } }, { phone: { contains } }],
		...getDateFilterOptions(filterData),
	}
}

function getMembersAttendances(members: Member[]): MemberMonthlyAttendances[] {
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

export async function createExportDepartmentMembersFile({
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
		feature: 'Membres du département',
		fileName,
		customerName,
	})

	return '/' + fileLink
}
