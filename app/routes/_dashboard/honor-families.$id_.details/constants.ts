import { RiAddLine, RiFileExcel2Line } from '@remixicon/react'
import type { SpeedDialAction } from '~/components/layout/mobile/speed-dial-menu'

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

export const VIEWS_OPTIONS = [
	{
		id: 'culte',
		label: 'Culte',
	},
	{
		id: 'service',
		label: 'Service',
	},
	{
		id: 'stat',
		label: 'Statistiques',
	},
]

export const FORM_INTENT = {
	CREATE: 'create_member',
	UPLOAD: 'upload_members',
	ADD_ASSISTANT: 'add_assistant',
}

export const speedDialItemsActions = {
	CREATE_MEMBER: 'create-member',
	UPLOAD_MEMBERS: 'upload-member',
	SHOW_FILTER: 'show-filter',
}

export const speedDialItems: SpeedDialAction[] = [
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
