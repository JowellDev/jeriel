import { prisma } from '~/infrastructures/database/prisma.server'
import type { Prisma } from '@prisma/client'

export const DEPARTMENT_SELECT = {
	id: true,
	name: true,
	manager: {
		select: { id: true, name: true, phone: true, email: true, isAdmin: true },
	},
	members: { select: { name: true, phone: true, email: true, id: true } },
	createdAt: true,
} satisfies Prisma.DepartmentSelect

export const EXPORT_DEPARTMENT_SELECT = {
	name: true,
	manager: { select: { name: true, email: true, phone: true } },
	members: { select: { id: true } },
} satisfies Prisma.DepartmentSelect

export async function getDepartmentsForExport(query: string, churchId: string) {
	const where = buildDepartmentWhere(query, churchId)

	return prisma.department.findMany({
		where,
		select: EXPORT_DEPARTMENT_SELECT,
		orderBy: { name: 'asc' },
	})
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
