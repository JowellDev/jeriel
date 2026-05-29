import type { Prisma } from '@prisma/client'

export const FORM_INTENT = {
	CREATE_TRIBE: 'create',
	UPDATE_TRIBE: 'update',
	EXPORT_TRIBE: 'export',
}

export const EXPORT_TRIBES_SELECT = {
	name: true,
	manager: { select: { name: true, email: true, phone: true } },
	members: {
		where: { isActive: true, deletedAt: null },
		select: {
			name: true,
			phone: true,
			email: true,
			location: true,
			gender: true,
			birthday: true,
			maritalStatus: true,
		},
		orderBy: { name: 'asc' },
	},
} satisfies Prisma.TribeSelect
