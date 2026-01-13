import {
	RiArticleLine,
	RiBuilding2Line,
	RiCakeLine,
	RiCalendarCheckLine,
	RiCrossLine,
	RiDashboardLine,
	RiGroup3Line,
	RiGroupLine,
	RiHeartsLine,
	RiUserForbidLine,
	RiUserSettingsLine,
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
				to: '/admin-management',
				label: 'Administrateurs',
				Icon: RiUserSettingsLine,
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
			{
				to: '/birthdays',
				label: 'Anniversaires',
				Icon: RiCakeLine,
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
				label: 'Mon département',
				Icon: RiBuilding2Line,
			},
			{
				to: '/my-reports',
				label: 'Mes rapports',
				Icon: RiArticleLine,
			},
			{
				to: '/services',
				label: 'Services',
				Icon: RiCalendarCheckLine,
			},
			{
				to: '/archives-request',
				label: "Demande d'archives",
				Icon: RiUserForbidLine,
			},
			{
				to: '/birthdays',
				label: 'Anniversaires',
				Icon: RiCakeLine,
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
				label: 'Ma tribu',
				Icon: RiGroup3Line,
			},
			{
				to: '/my-reports',
				label: 'Mes rapports',
				Icon: RiArticleLine,
			},
			{
				to: '/services',
				label: 'Services',
				Icon: RiCalendarCheckLine,
			},
			{
				to: '/archives-request',
				label: "Demande d'archives",
				Icon: RiUserForbidLine,
			},
			{
				to: '/birthdays',
				label: 'Anniversaires',
				Icon: RiCakeLine,
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
				label: "Ma famille d'honneur",
				Icon: RiHeartsLine,
			},
			{
				to: '/my-reports',
				label: 'Mes rapports',
				Icon: RiArticleLine,
			},
			{
				to: '/archives-request',
				label: "Demande d'archives",
				Icon: RiUserForbidLine,
			},
			{
				to: '/birthdays',
				label: 'Anniversaires',
				Icon: RiCakeLine,
			},
		],
	},
]

const roleMenuMap = new Map(rolesMenuLinks.map(menu => [menu.role, menu.links]))

export function getRoleMenuLinks(roles: Role[]): SidebarLink[] {
	const linkMap = new Map<string, SidebarLink>()

	for (const role of roles) {
		const links = roleMenuMap.get(role)

		if (!links) continue

		for (const link of links) {
			if (!linkMap.has(link.to)) {
				linkMap.set(link.to, link)
			}
		}
	}

	return Array.from(linkMap.values())
}
