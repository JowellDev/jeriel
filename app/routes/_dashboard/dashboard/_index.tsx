import { loaderFn } from './loader.server'
import { type MetaFunction, useLoaderData } from '@remix-run/react'
import AdminDashboard from './components/admin/admin-dashboard'
import ManagerDashboard from './components/manager/manager-dashboard'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { useState } from 'react'
import { RiDashboardLine, RiGroup2Line } from '@remixicon/react'

export const meta: MetaFunction = () => [{ title: 'Jeriel | Tableau de bord' }]

export const loader = loaderFn

type DashboardView = 'admin' | 'manager'

export default function Dashboard() {
	const loaderData = useLoaderData<typeof loaderFn>()
	const [activeView, setActiveView] = useState<DashboardView>('admin')

	if (!loaderData.isChurchAdmin) {
		return <ManagerDashboard loaderData={loaderData} />
	}

	if (!loaderData.isAlsoManager) {
		return <AdminDashboard loaderData={loaderData} />
	}

	return (
		<div className="flex flex-col h-full">
			<div className="flex justify-center px-4 pt-3 pb-1 bg-white border-b border-gray-100 shrink-0">
				<div className="inline-flex rounded-full bg-gray-100 p-1 gap-1">
					<button
						type="button"
						onClick={() => setActiveView('admin')}
						className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
							activeView === 'admin'
								? 'bg-white text-gray-900 shadow-sm'
								: 'text-gray-500 hover:text-gray-700'
						}`}
					>
						<RiDashboardLine size={16} />
						Vue globale
					</button>
					<button
						type="button"
						onClick={() => setActiveView('manager')}
						className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
							activeView === 'manager'
								? 'bg-white text-gray-900 shadow-sm'
								: 'text-gray-500 hover:text-gray-700'
						}`}
					>
						<RiGroup2Line size={16} />
						Vue responsable
					</button>
				</div>
			</div>

			{activeView === 'admin' ? (
				<AdminDashboard loaderData={loaderData} />
			) : (
				<ManagerDashboard loaderData={loaderData} />
			)}
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
