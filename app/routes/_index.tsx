import {
	redirect,
	type LoaderFunctionArgs,
	type MetaFunction,
} from '@remix-run/node'
import { Outlet, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Sidebar } from '~/components/layout/sidebar'
import { requireUser } from '~/utils/auth.server'
import { getRoleMenuLinks } from '~/shared/menus-links'
import { useNotifications } from '~/hooks/notifications.hook'

export const meta: MetaFunction = () => [{ title: 'Jeriel' }]

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const user = await requireUser(request)
	const currentUrl = new URL(request.url)
	if (currentUrl.pathname !== '/dashboard') return redirect('/dashboard')
	return { user }
}

export default function Index() {
	const { user } = useLoaderData<typeof loader>()
	const links = getRoleMenuLinks(user.roles)
	const { unread, unseen } = useNotifications()

	return (
		<main className="flex flex-col md:flex-row h-screen">
			<Sidebar
				links={links}
				unread={unread}
				unseen={unseen}
				userRoles={user.roles}
			/>
			<Outlet />
		</main>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
