import type { MetaFunction } from '@remix-run/node'
import { Outlet } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Sidebar } from '~/components/layout/sidebar'
import { loaderFn } from './loader.server'

export const meta: MetaFunction = () => [{ title: 'Nobu Stack' }]

export const loader = loaderFn

export default function Index() {
	return (
		<main className="flex flex-col md:flex-row h-screen">
			<Sidebar />
			<Outlet />
		</main>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
