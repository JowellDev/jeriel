import type { Prisma } from '@prisma/client'

export const MANAGED_ENTITY_SELECT = {
	id: true,
	name: true,
	members: {
		where: { deletedAt: null, isActive: true },
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
		},
		orderBy: {
			name: 'asc',
		},
	},
	services: {
		select: {
			id: true,
			from: true,
			to: true,
		},
	},
} satisfies
	| Prisma.TribeSelect
	| Prisma.DepartmentSelect
	| Prisma.HonorFamilySelect
