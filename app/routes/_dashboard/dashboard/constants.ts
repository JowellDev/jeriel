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

export const views = [
	{
		id: 'CULTE' as const,
		label: 'Culte',
	},
	{
		id: 'MEETING' as const,
		label: 'Réunion',
	},
	{
		id: 'STAT' as const,
		label: 'Statistiques',
	},
]

export const newViews = [
	{
		id: 'STAT' as const,
		label: 'Statistiques',
	},

	{
		id: 'NEW_MEMBERS' as const,
		label: 'Suivi des nouveaux fidèles',
	},
]
