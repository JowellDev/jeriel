import { Outlet } from '@remix-run/react'
import { Sidebar } from '../../components/layout/sidebar'

export default function Dashboard() {
	return (
		<main className="flex flex-col md:flex-row h-screen">
			<Sidebar />
			<Outlet />
		</main>
	)
}
