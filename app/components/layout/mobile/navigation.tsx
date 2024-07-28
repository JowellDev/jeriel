import { motion } from 'framer-motion'
import { Form, NavLink } from '@remix-run/react'
import { cn } from '~/utils/ui'
import {
	RiAdminLine,
	RiLogoutCircleRLine,
	RiNotificationLine,
} from '@remixicon/react'
import { getNavLinkClassName, MenuItem } from '../menu-item'
import type { MenuLink } from '../menu-link'

export const Navigation = ({
	links,
	className,
}: {
	links: MenuLink[]
	className: string
}) => (
	<motion.div className={cn('menu-item-container', className)}>
		<div className="flex flex-col justify-between h-[80%]">
			<div className="flex-1 border-b border-[#EEEEEE]">
				{links.map(({ to, label, Icon }, index) => (
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
			<div className="py-4">
				<MenuItem Icon={RiNotificationLine} label="Notifications" />
				<MenuItem Icon={RiAdminLine} label="Administration" />
				<Form method="POST" action="/logout" className="w-full">
					<MenuItem Icon={RiLogoutCircleRLine} label="Se déconnecter" />
				</Form>
			</div>
		</div>
	</motion.div>
)
