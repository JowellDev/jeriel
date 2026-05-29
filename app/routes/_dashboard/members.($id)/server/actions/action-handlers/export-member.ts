import { parseWithZod } from '@conform-to/zod'
import { parseISO } from 'date-fns'
import invariant from 'tiny-invariant'
import { type Prisma } from '@prisma/client'

import { type AuthenticatedUser } from '~/utils/auth.server'
import { prisma } from '~/infrastructures/database/prisma.server'
import type { Member } from '~/models/member.model'
import { getMembersAttendances } from '~/shared/attendance'
import {
	prepareDateRanges,
	fetchAttendancesByMemberIds,
} from '~/helpers/attendance.server'
import { createMembersExcelFile } from '~/utils/excel.server'

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

	const [allAttendances, previousAttendances] = await Promise.all([
		fetchAttendancesByMemberIds(memberIds, fromDate, processedToDate),
		fetchAttendancesByMemberIds(memberIds, previousFrom, previousTo),
	])

	const membersWithAttendances = getMembersAttendances(
		members,
		currentMonthSundays,
		previousMonthSundays,
		allAttendances,
		previousAttendances,
	)

	const fileLink = await createMembersExcelFile(
		membersWithAttendances,
		toDate,
		'Liste des membres',
	)

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
