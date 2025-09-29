import { RiDashboardLine, RiPulseLine } from '@remixicon/react'
import { type SpeedDialAction } from '~/components/layout/mobile/speed-dial-menu'
import starEyesAnimation from './components/admin/animations/star-eyes.json'
import angelAnimation from './components/admin/animations/angel.json'
import smileAnimation from './components/admin/animations/smile.json'
import cryingAnimation from './components/admin/animations/crying.json'
import type { AttendanceData } from '~/shared/types'

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

export const defaultLeftData: AttendanceData = {
	date: 'Janvier 2024',
	total: 520,
	stats: [
		{
			type: 'Très régulier',
			percentage: '89%',
			color: 'bg-[#3BC9BF]',
			lottieData: starEyesAnimation,
		},
		{
			type: 'Régulier',
			percentage: '9%',
			color: 'bg-[#E9C724]',
			lottieData: angelAnimation,
		},
		{
			type: 'Peu régulier',
			percentage: '1%',
			color: 'bg-[#F68D2B]',
			lottieData: smileAnimation,
		},
		{
			type: 'Absent',
			percentage: '1%',
			color: 'bg-[#EA503D]',
			lottieData: cryingAnimation,
		},
	],
	memberStats: [
		{ name: 'Nouveaux', value: 200, color: '#3BC9BF' },
		{ name: 'Anciens', value: 320, color: '#F68D2B' },
	],
}

export const defaultRightData: AttendanceData = {
	date: 'Février 2024',
	total: 520,
	stats: [
		{
			type: 'Très régulier',
			percentage: '89%',
			color: 'bg-[#3BC9BF]',
			lottieData: starEyesAnimation,
		},
		{
			type: 'Régulier',
			percentage: '9%',
			color: 'bg-[#E9C724]',
			lottieData: angelAnimation,
		},
		{
			type: 'Peu régulier',
			percentage: '1%',
			color: 'bg-[#F68D2B]',
			lottieData: smileAnimation,
		},
		{
			type: 'Absent',
			percentage: '1%',
			color: 'bg-[#EA503D]',
			lottieData: cryingAnimation,
		},
	],
	memberStats: [
		{ name: 'Nouveaux', value: 200, color: '#3BC9BF' },
		{ name: 'Anciens', value: 320, color: '#F68D2B' },
	],
}
