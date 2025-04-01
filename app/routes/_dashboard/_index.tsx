import { type MetaFunction, Outlet, useLoaderData } from '@remix-run/react'
import { Sidebar } from '../../components/layout/sidebar'
import { loaderFn } from './loader.server'
import { getRoleMenuLinks } from '~/shared/menus-links'
import { Toaster } from 'sonner'
import { useNotifications } from '~/hooks/notifications.hook'

export const meta: MetaFunction = () => [{ title: "Vase d'honneur" }]

export const loader = loaderFn

export default function Dashboard() {
	const { user } = useLoaderData<typeof loaderFn>()
	const links = getRoleMenuLinks(user.roles)
	const { unread, unseen } = useNotifications()

	return (
		<main className="flex flex-col md:flex-row h-screen">
			<Sidebar links={links} unread={unread} unseen={unseen} />
			<Outlet />
			<Toaster richColors visibleToasts={1} />
		</main>
	)
}
