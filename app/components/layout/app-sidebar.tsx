import { useMemo } from 'react'
import { Form, NavLink, useMatch } from '@remix-run/react'
import {
	type RemixiconComponentType,
	RiAdminLine,
	RiLogoutCircleRLine,
	RiNotificationLine,
} from '@remixicon/react'
import { type Role } from '@prisma/client'

import { useUpdateNotificationStatus } from '~/hooks/update-notification-status.hook'

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuBadge,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from '~/components/ui/sidebar'

export type SidebarLink = {
	label: string
	to: string
	Icon: RemixiconComponentType
}

interface Props {
	userRoles: Role[]
	links: SidebarLink[]
	unread?: number
	unseen?: number
}

export function AppSidebar({
	links,
	unread,
	unseen,
	userRoles,
}: Readonly<Props>) {
	const { updateStatus } = useUpdateNotificationStatus()
	const hasUnseen = Boolean(unseen && unseen > 0)
	const hasUnread = Boolean(unread && unread > 0)

	const showNotification = useMemo(
		() => !userRoles.some(role => role === 'SUPER_ADMIN'),
		[userRoles],
	)

	return (
		<Sidebar collapsible="icon" className="border-none">
			<SidebarHeader className="border-b border-sidebar-border">
				<div className="flex h-12 items-center justify-center">
					<img
						src="/images/white-logo-vh.png"
						alt="Jeriel"
						className="h-8 w-auto group-data-[collapsible=icon]:hidden"
					/>
					<img
						src="/images/favicon.png"
						alt="Jeriel"
						className="hidden h-7 w-7 group-data-[collapsible=icon]:block"
					/>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup className="py-2">
					<SidebarGroupContent>
						<SidebarMenu className="gap-1">
							{links.map(link => (
								<NavMenuItem key={link.to} {...link} />
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-t border-sidebar-border py-2">
				<SidebarMenu className="gap-1">
					{showNotification && (
						<SidebarMenuItem>
							<NavMenuItem
								to="/notifications"
								label="Notifications"
								Icon={RiNotificationLine}
								onClick={updateStatus}
								inline
							/>
							{(hasUnseen || hasUnread) && (
								<SidebarMenuBadge
									className={
										hasUnseen
											? 'bg-sidebar-ring text-sidebar-primary-foreground'
											: 'bg-destructive text-destructive-foreground'
									}
								>
									{unread && unread > 0 ? unread : ''}
								</SidebarMenuBadge>
							)}
						</SidebarMenuItem>
					)}
					<NavMenuItem to="/account" label="Mon compte" Icon={RiAdminLine} />
					<SidebarSeparator />
					<SidebarMenuItem>
						<Form method="POST" action="/logout" className="w-full">
							<SidebarMenuButton
								type="submit"
								tooltip="Se déconnecter"
								className="h-9 w-full gap-2.5 px-3"
							>
								<RiLogoutCircleRLine size={18} />
								<span>Se déconnecter</span>
							</SidebarMenuButton>
						</Form>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	)
}

type NavMenuItemProps = SidebarLink & {
	onClick?: () => void
	/** rend uniquement le bouton sans l'enrober d'un SidebarMenuItem (pour le footer avec badge) */
	inline?: boolean
}

function NavMenuItem({
	to,
	label,
	Icon,
	onClick,
	inline,
}: Readonly<NavMenuItemProps>) {
	const isActive = Boolean(useMatch({ path: to, end: false }))

	const button = (
		<SidebarMenuButton
			asChild
			isActive={isActive}
			tooltip={label}
			className="h-8 gap-2.5 px-3"
		>
			<NavLink to={to} onClick={onClick} data-testid="sidebar-item">
				<Icon size={18} />
				<span>{label}</span>
			</NavLink>
		</SidebarMenuButton>
	)

	return inline ? button : <SidebarMenuItem>{button}</SidebarMenuItem>
}
