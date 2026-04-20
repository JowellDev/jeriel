import { type LinksFunction, type LoaderFunctionArgs } from '@remix-run/node'
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react'
import { useEffect } from 'react'
import { getUser } from '~/utils/auth.server'
import appStylesHref from './styles/app.css?url'
import tailwindStylesHref from './styles/tailwind.css?url'
import { Toaster } from 'sonner'
import { PWAInstallPrompt } from '~/components/pwa-install-prompt'

export const links: LinksFunction = () => [
	{ rel: 'icon', type: 'image/png', href: '/images/favicon.png' },
	{ rel: 'manifest', href: '/manifest.webmanifest' },
	{ rel: 'stylesheet', href: tailwindStylesHref },
	{ rel: 'stylesheet', href: appStylesHref },
]

export const loader = async ({ request }: LoaderFunctionArgs) => {
	return { user: await getUser(request) } as const
}

function PWARegister() {
	useEffect(() => {
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js', { scope: '/' })
		}
	}, [])
	return null
}

export default function App() {
	return (
		<html lang="en" className="h-full">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<meta name="theme-color" content="#E9C724" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="Jériel" />
				<link rel="apple-touch-icon" href="/images/favicon.png" />
				<Meta />
				<Links />
			</head>
			<body className="h-full">
				<Outlet />
				<Toaster closeButton richColors />
				<PWAInstallPrompt />
				<PWARegister />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}
