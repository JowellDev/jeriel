import type { Prisma, User } from '@prisma/client'
import type { MemberFilterOptions } from '../types'
import { normalizeDate } from '~/utils/date'
import { MemberStatus } from '~/shared/enum'

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
		NOT: { isActive: false, deletedAt: { not: null } },
		...getDateFilterOptions(params),
	} satisfies Prisma.UserWhereInput
}

function getDateFilterOptions(options: MemberFilterOptions) {
	const { status, to, from } = options

	const isAll = status === 'ALL'
	const statusEnabled = !!status && !isAll
	const isNew = status === MemberStatus.NEW

	const startDate = normalizeDate(new Date(from), 'start')
	const endDate = normalizeDate(new Date(to), 'end')

	return {
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
