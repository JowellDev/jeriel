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
	onClick,
	hasUnseenAndUnread,
}: {
	links: MenuLink[]
	className: string
	onClick: () => void
	hasUnseenAndUnread?: boolean
}) => {
	function handleLinkClick() {
		onClick()
	}

	return (
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
							onClick={handleLinkClick}
							data-testid="sidebar-item"
						>
							<MenuItem Icon={Icon} label={label} />
						</NavLink>
					))}
				</div>
				<div className="py-4">
					<NavLink
						to="/notifications"
						onClick={handleLinkClick}
						className={({ isActive, isPending }) =>
							getNavLinkClassName(isActive, isPending)
						}
					>
						<MenuItem
							Icon={RiNotificationLine}
							label="Notifications"
							hasUnseenAndUnread={hasUnseenAndUnread}
						/>
					</NavLink>
					<NavLink
						to="/account"
						onClick={handleLinkClick}
						className={({ isActive, isPending }) =>
							getNavLinkClassName(isActive, isPending)
						}
					>
						<MenuItem Icon={RiAdminLine} label="Mon compte" />
					</NavLink>
					<Form method="POST" action="/logout" className="w-full">
						<MenuItem Icon={RiLogoutCircleRLine} label="Se déconnecter" />
					</Form>
				</div>
			</div>
		</motion.div>
	)
}
