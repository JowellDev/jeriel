import type { MetaFunction } from '@remix-run/node'
import { Outlet, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Sidebar } from '~/components/layout/sidebar'
import { loaderFn } from './loader.server'
import { getRoleMenuLinks } from '~/shared/menus-links'
import { useNotifications } from '~/hooks/notifications.hook'

export const meta: MetaFunction = () => [{ title: 'Nobu Stack' }]

export const loader = loaderFn

export default function Index() {
	const { user } = useLoaderData<typeof loaderFn>()
	const links = getRoleMenuLinks(user.roles)
	const { unread, unseen } = useNotifications()

	return (
		<main className="flex flex-col md:flex-row h-screen">
			<Sidebar links={links} unread={unread} unseen={unseen} />
			<Outlet />
		</main>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
