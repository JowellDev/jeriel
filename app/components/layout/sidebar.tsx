import { Form, NavLink } from '@remix-run/react'
import {
	type RemixiconComponentType,
	RiAdminLine,
	RiBuilding2Line,
	RiCrossLine,
	RiDashboardLine,
	RiGroup3Line,
	RiGroupLine,
	RiHeartsLine,
	RiLogoutCircleRLine,
	RiNotificationLine,
} from '@remixicon/react'
import { useMediaQuery } from 'usehooks-ts'
import { MobileMenu } from './mobile/mobile-menu'
import { getNavLinkClassName, MenuItem } from './menu-item'
import { MOBILE_WIDTH } from './mobile/width'

const Logo = '/images/white-logo-vh.png'

type SidebarLink = {
	label: string
	to: string
	Icon: RemixiconComponentType
}

const links: SidebarLink[] = [
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
]

export function Sidebar() {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)

	if (!isDesktop) return <MobileMenu links={links} />

	return (
		<div className="flex flex-col bg-[#226C67] py-4 text-[#EEEEEE] w-1/4 ipad-pro:w-[25%] lg:w-1/6  h-full md:h-auto">
			<div className="flex justify-between p-4 border-b border-[#EEEEEE]">
				<div className="flex justify-center items-center w-full">
					<img src={Logo} alt="logo" className="h-auto" />
				</div>
			</div>
			<div className="flex-1 p-4 border-b border-[#EEEEEE]">
				{links.map(({ to, Icon, label }, index) => (
					<NavLink
						to={to}
						key={`${label + index}`}
						className={({ isActive, isPending }) =>
							getNavLinkClassName(isActive, isPending)
						}
						data-testid="sidebar-item"
					>
						<MenuItem Icon={Icon} label={label} />
					</NavLink>
				))}
			</div>
			<div className="p-4">
				<MenuItem Icon={RiNotificationLine} label="Notifications" />
				<MenuItem Icon={RiAdminLine} label="Administration" />
				<Form method="POST" action="/logout" className="w-full">
					<MenuItem Icon={RiLogoutCircleRLine} label="Se déconnecter" />
				</Form>
			</div>
		</div>
	)
}
