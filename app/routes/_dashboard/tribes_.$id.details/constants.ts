import { RiAddLine, RiFileExcel2Line } from '@remixicon/react'
import { type SpeedDialAction } from '~/components/layout/mobile/speed-dial-menu'

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
	EXPORT: 'export_members',
}

export const speedDialItemsActions = {
	ADD_MEMBER: 'add-member',
	UPLOAD_MEMBERS: 'upload-members',
}

export const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Créer un fidèle',
		action: speedDialItemsActions.ADD_MEMBER,
	},
	{
		Icon: RiFileExcel2Line,
		label: 'Importer des fidèles',
		action: speedDialItemsActions.UPLOAD_MEMBERS,
	},
]
