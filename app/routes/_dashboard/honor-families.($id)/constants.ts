import type { Prisma } from '@prisma/client'
import { RiAddLine } from '@remixicon/react'
import type { SpeedDialAction } from '~/components/layout/mobile/speed-dial-menu'

export const FORM_INTENT = {
	CREATE: 'create_honor_family',
	EDIT: 'update_honor_family',
	EXPORT: 'export-honor-families',
}

export const speedDialItemsActions = {
	CREATE_HONOR_FAMILY: 'create-honor-family',
	UPLOAD_FILE: 'upload-file',
}

export const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: "Créer une famille d'honneur",
		action: speedDialItemsActions.CREATE_HONOR_FAMILY,
	},
]

export const EXPORT_HONOR_FAMILY_SELECT = {
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
} satisfies Prisma.HonorFamilySelect
