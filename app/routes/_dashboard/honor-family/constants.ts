import type { SpeedDialAction } from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine, RiDashboardLine, RiFileExcel2Line } from '@remixicon/react'

export const speedDialItemsActions = {
	CREATE_MEMBER: 'create-member',
	UPLOAD_MEMBERS: 'upload-member',
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
