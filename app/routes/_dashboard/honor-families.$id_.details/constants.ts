import { RiAddLine, RiDashboardLine, RiFileExcel2Line } from '@remixicon/react'
import type { SpeedDialAction } from '~/components/layout/mobile/speed-dial-menu'
import { VIEWS, type ViewOption } from './types'

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

export enum STATUS {
	ALL = 'ALL',
	NEW = 'NEW',
	OLD = 'OLD',
}

export const VIEWS_OPTIONS: { id: ViewOption; label: string }[] = [
	{ id: VIEWS.CULTE, label: 'Culte' },
	{ id: VIEWS.SERVICE, label: 'Service' },
	{ id: VIEWS.STAT, label: 'Statistiques' },
]

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
		label: "Ajouter des fidèles à partir d'un fichier",
		action: speedDialItemsActions.UPLOAD_MEMBERS,
	},
]
