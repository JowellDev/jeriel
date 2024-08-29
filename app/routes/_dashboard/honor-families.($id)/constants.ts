import { RiAddLine } from '@remixicon/react'
import { SpeedDialAction } from '~/components/layout/mobile/speed-dial-menu'

export const FORM_INTENT = {
	CREATE: 'create_honor_family',
	EDIT: 'update_honor_family',
	UPLOAD: 'upload_members_file',
}

export const speedDialItemsActions = {
	CREATE_HONOR_FAMILY: 'create-honor-family',
	UPLOAD_FILE: 'upload-file',
}

export const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Créer une famille d’honneur',
		action: speedDialItemsActions.CREATE_HONOR_FAMILY,
	},
]
