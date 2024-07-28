import {
	RiBuilding2Line,
	RiCrossLine,
	RiDashboardLine,
	RiGroup3Line,
	RiHeartsLine,
	type RemixiconComponentType,
} from '@remixicon/react'

export type MenuLink = {
	label: string
	to: string
	Icon: RemixiconComponentType
}

export const menuLinks: MenuLink[] = [
	{
		to: '/',
		label: 'Tableau de bord',
		Icon: RiDashboardLine,
	},
	{
		to: '/churches',
		label: 'Eglises',
		Icon: RiCrossLine,
	},
	{
		to: '/tribes',
		label: 'Tribus',
		Icon: RiGroup3Line,
	},
	{
		to: '/families',
		label: "Familles d'honneur",
		Icon: RiHeartsLine,
	},
	{
		to: '/departments',
		label: 'Départements',
		Icon: RiBuilding2Line,
	},
]
