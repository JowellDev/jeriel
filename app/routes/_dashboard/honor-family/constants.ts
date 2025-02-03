import type { SpeedDialAction } from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine, RiDashboardLine, RiFileExcel2Line } from '@remixicon/react'

export const FORM_INTENT = {
	CREATE: 'create_member',
	UPLOAD: 'upload_members',
	EXPORT: 'export_members',
	ADD_ASSISTANT: 'add_assistant',
}

export const speedDialItemsActions = {
	CREATE_MEMBER: 'create-member',
	UPLOAD_MEMBERS: 'upload-member',
	SHOW_FILTER: 'show-filter',
	MARK_ATTENDANCE: 'mark-attendance',
}

export const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiDashboardLine,
		label: 'Marquer la présence',
		action: speedDialItemsActions.MARK_ATTENDANCE,
	},
	{
		Icon: RiAddLine,
		label: 'Ajouter un fidèle manuellement',
		action: speedDialItemsActions.CREATE_MEMBER,
	},
	{
		Icon: RiFileExcel2Line,
		label: 'Importer des fidèles',
		action: speedDialItemsActions.UPLOAD_MEMBERS,
	},
]

export enum STATUS {
	ALL = 'ALL',
	NEW = 'NEW',
	OLD = 'OLD',
}

export const stateFilterData = [
	{ value: 'ALL', label: 'Tout' },
	{ value: 'VERY_REGULAR', label: 'Tres régulier' },
	{ value: 'REGULAR', label: 'Régulier' },
	{ value: 'MEDIUM_REGULAR', label: 'Moyennement régulier' },
	{ value: 'LITTLE_REGULAR', label: 'Peu régulier' },
	{ value: 'ABSENT', label: 'Absent' },
]

export const statusFilterData = [
	{ value: 'ALL', label: 'Tout' },
	{ value: 'NEW', label: 'Nouveau' },
	{ value: 'OLD', label: 'Ancien' },
]
