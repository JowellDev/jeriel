import { parseWithZod } from '@conform-to/zod'
import { type AuthenticatedUser } from '~/utils/auth.server'
import { filterSchema } from '../../../schema'
import invariant from 'tiny-invariant'
import { createMemberFile, getFilterOptions } from '../../../utils/server'
import { type Prisma } from '@prisma/client'
import { prisma } from '~/infrastructures/database/prisma.server'
import { getMonthSundays } from '~/utils/date'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'

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

	const fileLink = await createMemberFile({
		members,
		feature: 'Membres',
		customerName: currentUser.name,
	})

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
	})

	return getMembersExportAttendances(members)
}
