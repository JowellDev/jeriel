import { loaderFn } from './loader.server'
import { useDashboard } from './hooks/use-dashboard'
import { useLoaderData } from '@remix-run/react'
import AdminDashboard from './components/admin/admin-dashboard'
import ManagerDashboard from './components/manager/manager-dashboard'

export const loader = loaderFn

export default function Dashboard() {
	const loaderData = useLoaderData<typeof loaderFn>()
	const { data } = useDashboard(loaderData)

	return data.isChurchAdmin ? (
		<AdminDashboard data={data} />
	) : (
		<ManagerDashboard data={data} />
	)
}
