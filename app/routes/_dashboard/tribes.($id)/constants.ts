import { Prisma } from '@prisma/client'

export const FORM_INTENT = {
	CREATE_TRIBE: 'create',
	UPDATE_TRIBE: 'update',
	EXPORT_TRIBE: 'export',
}

export const EXPORT_TRIBES_SELECT = {
	name: true,
	manager: { select: { name: true, phone: true } },
	members: { select: { id: true } },
} satisfies Prisma.TribeSelect
