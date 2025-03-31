import type { MetaFunction } from '@remix-run/node'
import { Outlet, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Sidebar } from '~/components/layout/sidebar'
import { loaderFn } from './loader.server'
import { getRoleMenuLinks } from '~/shared/menus-links'
import { Toaster } from 'sonner'

export const meta: MetaFunction = () => [{ title: 'Nobu Stack' }]

export const loader = loaderFn

export default function Index() {
	const { user } = useLoaderData<typeof loaderFn>()
	const links = getRoleMenuLinks(user.roles)

	return (
		<main className="flex flex-col md:flex-row h-screen">
			<Sidebar links={links} />
			<Outlet />
			<Toaster richColors visibleToasts={1} />
		</main>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
