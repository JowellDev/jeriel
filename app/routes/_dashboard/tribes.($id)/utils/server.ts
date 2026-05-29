import { prisma } from '~/infrastructures/database/prisma.server'
import { EXPORT_TRIBES_SELECT } from '../constants'
import type { Prisma } from '@prisma/client'

export async function getTribesForExport(query: string, churchId: string) {
	const where = buildTribesWhere(query, churchId)

	return prisma.tribe.findMany({
		where,
		select: EXPORT_TRIBES_SELECT,
		orderBy: { name: 'asc' },
	})
}

export function buildTribesWhere(query: string, churchId: string) {
	const contains = `%${query.replace(/ /g, '%')}%`

	return {
		churchId: churchId,
		OR: [
			{ name: { contains, mode: 'insensitive' } },
			{ manager: { name: { contains, mode: 'insensitive' } } },
			{ manager: { phone: { contains } } },
		],
	} satisfies Prisma.TribeWhereInput
}
