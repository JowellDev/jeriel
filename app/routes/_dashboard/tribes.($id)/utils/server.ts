import { prisma } from '~/utils/db.server'
import { EXPORT_TRIBES_SELECT } from '../constants'
import type { ExportTribesData } from '../types'
import type { Prisma } from '@prisma/client'

export async function getTribes(query: string, churchId: string) {
	const where = buildTribesWhere(query, churchId)

	return prisma.tribe.findMany({
		where,
		select: EXPORT_TRIBES_SELECT,
		orderBy: { name: 'asc' },
	})
}

export function getDataRows(
	tribes: ExportTribesData[],
): Record<string, string>[] {
	return tribes.map(t => ({
		Nom: t.name,
		Responsable: t.manager?.name ?? 'N/D',
		Email: t.manager?.email ?? 'N/D',
		Téléphone: t.manager?.phone ?? 'N/D',
		'Total membres': t.members.length.toString(),
	}))
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
