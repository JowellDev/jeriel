import { useEffect, useState } from 'react'
import { type MetaFunction, Outlet, useLoaderData } from '@remix-run/react'
import { useMediaQuery } from 'usehooks-ts'

import { loaderFn } from './loader.server'
import { getRoleMenuLinks } from '~/shared/menus-links'
import { MOBILE_WIDTH } from '~/shared/constants'
import { useNotifications } from '~/hooks/notifications.hook'
import { useRouteMatcher } from '~/utils/match'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { AppSidebar } from '~/components/layout/app-sidebar'
import { MobileMenu } from '~/components/layout/mobile/mobile-menu'
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'

export const meta: MetaFunction = () => [{ title: 'Jeriel' }]

export const loader = loaderFn

export default function Dashboard() {
	const { user, sidebarOpen } = useLoaderData<typeof loaderFn>()
	const links = getRoleMenuLinks(user.roles)
	const { unread, unseen } = useNotifications()

	const [isMounted, setIsMounted] = useState(false)
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const isDetailsRoute = useRouteMatcher('/details')

	useEffect(() => {
		setIsMounted(true)
	}, [])

	if (!isMounted) return null

	if (!isDesktop) {
		return (
			<main className="flex flex-col h-screen">
				{!isDetailsRoute && (
					<MobileMenu
						links={links}
						hasUnread={Boolean(unread && unread > 0)}
						hasUnseen={Boolean(unseen && unseen > 0)}
					/>
				)}
				<Outlet />
			</main>
		)
	}

	return (
		<SidebarProvider defaultOpen={sidebarOpen}>
			<AppSidebar
				links={links}
				unread={unread}
				unseen={unseen}
				userRoles={user.roles}
			/>
			<SidebarInset className="h-screen min-h-0 overflow-hidden">
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
