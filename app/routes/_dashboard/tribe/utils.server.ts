import { type User, type Prisma } from '@prisma/client'
import { normalizeDate } from '~/utils/date'
import type { MemberFilterOptions } from './types'
import { MemberStatus } from '~/shared/enum'

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
