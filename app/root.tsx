import { cssBundleHref } from '@remix-run/css-bundle'
import { type LinksFunction, type LoaderFunctionArgs } from '@remix-run/node'
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react'
import { getUser } from '~/utils/auth.server'
import { Toaster } from 'sonner'
import appStylesHref from './styles/app.css'
import tailwindStylesHref from './styles/tailwind.css'

export const links: LinksFunction = () => [
	{ rel: 'stylesheet', href: tailwindStylesHref },
	{ rel: 'stylesheet', href: appStylesHref },
	...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
]

export const loader = async ({ request }: LoaderFunctionArgs) => {
	return { user: await getUser(request) } as const
}

export default function App() {
	return (
		<html lang="en" className="h-full">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<Meta />
				<Links />
			</head>
			<body className="h-full">
				<Outlet />
				<Toaster richColors visibleToasts={1} />
				<ScrollRestoration />
				<Scripts />
				<LiveReload />
			</body>
		</html>
	)
}
