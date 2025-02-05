import { type MetaFunction, Outlet, useLoaderData } from '@remix-run/react'
import { Sidebar } from '../../components/layout/sidebar'
import { loaderFn } from './loader.server'
import { getRoleMenuLinks } from '~/shared/menus-links'
import { Toaster } from 'sonner'

export const meta: MetaFunction = () => [{ title: "Vase d'honneur" }]

export const loader = loaderFn

export default function Dashboard() {
	const { user } = useLoaderData<typeof loaderFn>()
	const links = getRoleMenuLinks(user.roles)

	return (
		<main className="flex flex-col md:flex-row h-screen">
			<Sidebar links={links} />
			<Outlet />
			<Toaster richColors position="top-center" visibleToasts={1} />
		</main>
	)
}
