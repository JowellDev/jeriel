import { loaderFn } from './loader.server'
import { type MetaFunction, useLoaderData } from '@remix-run/react'
import AdminDashboard from './components/admin/admin-dashboard'
import ManagerDashboard from './components/manager/manager-dashboard'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export const meta: MetaFunction = () => [{ title: 'Tableau de bord' }]

export const loader = loaderFn

export default function Dashboard() {
	const loaderData = useLoaderData<typeof loaderFn>()

	return loaderData.isChurchAdmin ? (
		<AdminDashboard loaderData={loaderData} />
	) : (
		<ManagerDashboard loaderData={loaderData} />
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
