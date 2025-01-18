import {
	RiArticleLine,
	RiBuilding2Line,
	RiCalendarCheckLine,
	RiCrossLine,
	RiDashboardLine,
	RiGroup3Line,
	RiGroupLine,
	RiHeartsLine,
	RiUserForbidLine,
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
				to: '/dashboard',
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
				to: '/dashboard',
				label: 'Tableau de bord',
				Icon: RiDashboardLine,
			},
			{
				to: '/members',
				label: 'Fidèles',
				Icon: RiGroupLine,
			},
			{
				to: '/tribes',
				label: 'Tribus',
				Icon: RiGroup3Line,
			},
			{
				to: '/honor-families',
				label: "Familles d'honneur",
				Icon: RiHeartsLine,
			},
			{
				to: '/departments',
				label: 'Départements',
				Icon: RiBuilding2Line,
			},
			{
				to: '/services',
				label: 'Services',
				Icon: RiCalendarCheckLine,
			},
			{
				to: '/reports',
				label: 'Rapports',
				Icon: RiArticleLine,
			},
			{
				to: '/archives',
				label: 'Archives',
				Icon: RiUserForbidLine,
			},
		],
	},
	{
		role: Role.DEPARTMENT_MANAGER,
		links: [
			{
				to: '/dashboard',
				label: 'Tableau de bord',
				Icon: RiDashboardLine,
			},
			{
				to: '/department',
				label: 'Département',
				Icon: RiBuilding2Line,
			},
			{
				to: '/archives',
				label: 'Archives',
				Icon: RiUserForbidLine,
			},
		],
	},
	{
		role: Role.TRIBE_MANAGER,
		links: [
			{
				to: '/dashboard',
				label: 'Tableau de bord',
				Icon: RiDashboardLine,
			},
			{
				to: '/tribe',
				label: 'Tribu',
				Icon: RiGroup3Line,
			},
			{
				to: '/archives',
				label: 'Archives',
				Icon: RiUserForbidLine,
			},
		],
	},
	{
		role: Role.HONOR_FAMILY_MANAGER,
		links: [
			{
				to: '/dashboard',
				label: 'Tableau de bord',
				Icon: RiDashboardLine,
			},
			{
				to: '/honor-family',
				label: "Famille d'honneur",
				Icon: RiHeartsLine,
			},
			{
				to: '/archives',
				label: 'Archives',
				Icon: RiUserForbidLine,
			},
		],
	},
]

export function getRoleMenuLinks(roles: Role[]) {
	const linkMap = new Map<string, SidebarLink>()

	roles.forEach(role => {
		const links = rolesMenuLinks.find(menu => menu.role === role)?.links || []
		links.forEach(link => {
			if (!linkMap.has(link.to)) linkMap.set(link.to, link)
		})
	})

	return Array.from(linkMap.values())
}
