import { type User, type Prisma } from '@prisma/client'
import { normalizeDate } from '~/utils/date'
import type { MemberFilterOptions } from './types'
import { MemberStatus } from '~/shared/enum'
import { prisma } from '~/infrastructures/database/prisma.server'
import type { Member } from '~/models/member.model'

export function getFilterOptions(
	params: MemberFilterOptions,
	currentUser: User,
): Prisma.UserWhereInput {
	const contains = `%${params.query.replace(/ /g, '%')}%`

	return {
		churchId: currentUser.churchId,
		tribeId: currentUser.tribeId,
		OR: [
			{ name: { contains, mode: 'insensitive' } },
			{ email: { contains, mode: 'insensitive' } },
			{ phone: { contains } },
		],
		isActive: true,
		...getDateFilterOptions(params),
	}
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

export function formatOptions(options: MemberFilterOptions) {
	const filterOptions: any = {}

	for (const [key, value] of Object.entries(options)) {
		filterOptions[key] = value.toLocaleString() === 'ALL' ? undefined : value
	}

	return filterOptions
}

export async function getTribeName(id: string) {
	return prisma.tribe.findFirst({
		where: { id },
		select: { name: true },
	})
}

export async function getExportTribeMembers(
	tribeId: string,
	churchId: string,
	filterData: MemberFilterOptions,
): Promise<Member[]> {
	const contains = `%${filterData.query.replace(/ /g, '%')}%`

	return prisma.user.findMany({
		where: {
			churchId,
			tribeId,
			isActive: true,
			deletedAt: null,
			OR: [
				{ name: { contains, mode: 'insensitive' } },
				{ email: { contains, mode: 'insensitive' } },
				{ phone: { contains } },
			],
			...getDateFilterOptions(filterData),
		},
		select: {
			id: true,
			integrationDate: true,
			name: true,
			email: true,
			phone: true,
			location: true,
			createdAt: true,
			birthday: true,
			gender: true,
			maritalStatus: true,
			pictureUrl: true,
		},
		orderBy: { name: 'asc' },
	})
}
