import {
	RiBuilding2Line,
	RiCrossLine,
	RiDashboardLine,
	RiGroup3Line,
	RiGroupLine,
	RiHeartsLine,
} from '@remixicon/react'
import { Role } from '@prisma/client'
import { type SidebarLink } from '~/components/layout/sidebar'

export interface RoleSidebarLinks {
	role: Role
	links: SidebarLink[]
}

export const rolesMenuLinks: RoleSidebarLinks[] = [
	{
		role: Role.SUPER_ADMIN,
		links: [
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
		],
	},
	{
		role: Role.ADMIN,
		links: [
			{
				to: '/',
				label: 'Tableau de bord',
				Icon: RiDashboardLine,
			},
			{
				to: '/faithful',
				label: 'Fidèles',
				Icon: RiGroupLine,
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
		],
	},
]

export function getRoleMenuLinks(roles: Role[]) {
	const links = roles
		.map(role => rolesMenuLinks.find(menu => menu.role === role)!.links)
		.flat()

	return [...new Set(links)]
}
