import { type Prisma, Role } from '@prisma/client'

export function getAdminFilterOptions(
	query: string,
	status: 'all' | 'active' | 'inactive',
	churchId: string,
): Prisma.UserWhereInput {
	const contains = `%${query.replace(/ /g, '%')}%`

	return {
		churchId,
		roles: { has: Role.ADMIN },
		OR: [
			{ name: { contains, mode: 'insensitive' } },
			{ email: { contains, mode: 'insensitive' } },
			{ phone: { contains } },
		],
		...(status === 'active' && { isActive: true }),
		...(status === 'inactive' && { isActive: false }),
	}
}
