import { RiAddLine } from '@remixicon/react'
import type { SpeedDialAction } from '~/components/layout/mobile/speed-dial-menu'

export const FORM_INTENT = {
	CREATE: 'create_honor_family',
	EDIT: 'update_honor_family',
}

export const DEFAULT_QUERY_TAKE = 25

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
