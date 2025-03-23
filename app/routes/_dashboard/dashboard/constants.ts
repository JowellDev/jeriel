import { RiDashboardLine, RiPulseLine } from '@remixicon/react'
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

export const adminDialItems: SpeedDialAction[] = [
	{
		Icon: RiPulseLine,
		label: 'Comparer',
		action: speedDialItemsActions.MARK_ATTENDANCE,
	},
]

export const compareViews = [
	{
		id: 'CULTE' as const,
		label: 'Culte',
	},
	{
		id: 'DEPARTMENT' as const,
		label: 'Département',
	},
	{
		id: 'TRIBE' as const,
		label: 'Tribu',
	},
	{
		id: 'HONOR_FAMILY' as const,
		label: "Famille d'honneur",
	},
]
