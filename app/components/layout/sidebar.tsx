import { NavLink } from '@remix-run/react'
import {
	type RemixiconComponentType,
	RiAdminLine,
	RiBuilding2Line,
	RiCrossLine,
	RiDashboardLine,
	RiGroup3Line,
	RiHeartsLine,
	RiLogoutCircleRLine,
	RiNotificationLine,
} from '@remixicon/react'
import { Button } from '../ui/button'
import { cn } from '../../utils/ui'

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
		to: '/church',
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

export function Sidebar() {
	return (
		<div className="flex flex-col bg-[#226C67] py-4 text-[#EEEEEE] w-full md:w-1/6 h-full md:h-auto">
			<div className="flex justify-between p-4 border-b border-[#EEEEEE]">
				<div className="flex justify-center  items-center w-full">
					<img src={Logo} alt="logo" className="w-20 h-auto" />
				</div>
				<button className="md:hidden" aria-label="Close Sidebar">
					X
				</button>
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
						<SidebarButton Icon={Icon} label={label} />
					</NavLink>
				))}
			</div>
			<div className="p-4">
				<SidebarButton Icon={RiNotificationLine} label="Notifications" />
				<SidebarButton Icon={RiAdminLine} label="Administration" />
				<SidebarButton Icon={RiLogoutCircleRLine} label="Se déconnecter" />
			</div>
		</div>
	)
}

function SidebarButton({
	Icon,
	label,
}: {
	Icon: RemixiconComponentType
	label: string
}) {
	return (
		<Button
			variant={'menu'}
			className="flex items-center space-x-2 py-2 md:py-6"
		>
			<Icon size={18} />
			<span>{label}</span>
		</Button>
	)
}

export const getNavLinkClassName = (isActive: boolean, isPending: boolean) => {
	return cn({
		'pending cursor-progress': isPending,
		'menu-active': isActive,
	})
}
