import type { MetaFunction } from '@remix-run/node'
import { Outlet } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { loaderFn } from './loader.server'

export const meta: MetaFunction = () => [{ title: 'Jeriel' }]

export const loader = loaderFn

export default function Index() {
	// Le loader redirige systématiquement vers /dashboard ; ce composant ne
	// s'affiche jamais réellement.
	return <Outlet />
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
