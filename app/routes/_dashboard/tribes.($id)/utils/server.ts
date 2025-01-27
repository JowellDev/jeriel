import { prisma } from '~/utils/db.server'
import { EXPORT_TRIBES_SELECT } from '../constants'
import { ExportTribesData } from '../types'

export async function getTribes() {
	return await prisma.tribe.findMany({
		where: {},
		select: EXPORT_TRIBES_SELECT,
	})
}

export function getDataRows(
	tribes: ExportTribesData[],
): Record<string, string>[] {
	return tribes.map(t => ({
		Nom: t.name,
		Responsable: t.manager.name,
		'N°. responsable': t.manager.phone,
		'Total membres': t.members.length.toString(),
	}))
}
