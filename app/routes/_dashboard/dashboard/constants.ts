import { RiDashboardLine } from '@remixicon/react'
import { type SpeedDialAction } from '~/components/layout/mobile/speed-dial-menu'

export const speedDialItemsActions = {
	MARK_ATTENDANCE: 'mark-attendance',
}

export const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiDashboardLine,
		label: 'Marquer la présence',
		action: speedDialItemsActions.MARK_ATTENDANCE,
	},
]
