import { prisma } from '~/utils/db.server'
import type { Prisma } from '@prisma/client'
import type { DepartmentExport } from '../model'

export const DEPARTMENT_SELECT = {
	id: true,
	name: true,
	manager: { select: { id: true, name: true, phone: true, isAdmin: true } },
	members: { select: { name: true, phone: true, id: true } },
	createdAt: true,
} satisfies Prisma.DepartmentSelect

export const EXPORT_DEPARTMENT_SELECT = {
	name: true,
	manager: { select: { name: true, phone: true } },
	members: { select: { id: true } },
} satisfies Prisma.DepartmentSelect

export async function getAllDepartments(query: string, churchId: string) {
	const where = buildDepartmentWhere(query, churchId)

	return await prisma.department.findMany({
		where,
		select: DEPARTMENT_SELECT,
		orderBy: { name: 'asc' },
	})
}

export function getDataRows(
	departments: DepartmentExport[],
): Record<string, string>[] {
	return departments.map(d => ({
		Nom: d.name,
		Responsable: d.manager?.name ?? 'N/A',
		'N°. responsable': d.manager?.phone ?? 'N/A',
		'Total membres': d.members.length.toString(),
	}))
}

export function buildDepartmentWhere(query: string, churchId: string) {
	const contains = `%${query.replace(/ /g, '%')}%`

	return {
		churchId,
		OR: [
			{ name: { contains, mode: 'insensitive' } },
			{ manager: { name: { contains, mode: 'insensitive' } } },
			{ manager: { phone: { contains } } },
		],
	} satisfies Prisma.DepartmentWhereInput
}
