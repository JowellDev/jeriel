import { useEffect, useState } from 'react'
import { Form, NavLink } from '@remix-run/react'
import {
	type RemixiconComponentType,
	RiAdminLine,
	RiLogoutCircleRLine,
	RiNotificationLine,
} from '@remixicon/react'
import { useMediaQuery } from 'usehooks-ts'
import { MobileMenu } from './mobile/mobile-menu'
import { getNavLinkClassName, MenuItem } from './menu-item'
import { MOBILE_WIDTH } from '~/shared/constants'
import { useRouteMatcher } from '~/utils/match'
import { useUpdateNotificationStatus } from '~/hooks/update-notification-status.hook'
// import { useUpdateNotificationStatus } from '~/hooks/update-notification-status'

const Logo = '/images/white-logo-vh.png'

export type SidebarLink = {
	label: string
	to: string
	Icon: RemixiconComponentType
}

interface Props {
	links: SidebarLink[]
	unread?: number
	unseen?: number
}

export function Sidebar({ links, unread, unseen }: Readonly<Props>) {
	const [isMounted, setIsMounted] = useState(false)
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const { updateStatus } = useUpdateNotificationStatus()
	const hasUnseen = Boolean(unseen && unseen > 0)
	const hasUnread = Boolean(unread && unread > 0)

	useEffect(() => {
		setIsMounted(true)
	}, [])

	const isDetailsRoute = useRouteMatcher('/details')

	if (!isMounted) return null

	if (!isDesktop) {
		return isDetailsRoute ? null : (
			<MobileMenu links={links} hasUnread={hasUnread} hasUnseen={hasUnseen} />
		)
	}

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
						className={({ isActive, isPending }) => {
							return getNavLinkClassName(isActive, isPending)
						}}
						data-testid="sidebar-item"
					>
						<MenuItem Icon={Icon} label={label} />
					</NavLink>
				))}
			</div>
			<div className="p-4">
				<NavLink
					to="/notifications"
					className={({ isActive, isPending }) =>
						getNavLinkClassName(isActive, isPending)
					}
				>
					<MenuItem
						Icon={RiNotificationLine}
						label="Notifications"
						hasUnread={hasUnread}
						hasUnseen={hasUnseen}
						onClick={updateStatus}
					/>
				</NavLink>
				<NavLink
					to="/account"
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
	)
}
