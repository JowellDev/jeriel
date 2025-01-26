import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { RiFileExcel2Line, RiPulseLine } from '@remixicon/react'
import { LineChartCard } from './line-chart-card'
import { PieChartCard } from './pie-chart-card'

import type { LoaderType } from '../../loader.server'
import type { SerializeFrom } from '@remix-run/node'
import { useDashboard } from '../../hooks/use-dashboard'

type LoaderReturnData = SerializeFrom<LoaderType>

interface DashboardProps {
	loaderData: LoaderReturnData
}

function AdminDashboard({ loaderData }: Readonly<DashboardProps>) {
	const { data } = useDashboard(loaderData)
	return (
		<MainContent
			headerChildren={
				<Header title="Tableau de bord" userName={data.user.name}>
					<div className="hidden sm:flex sm:space-x-2 sm:items-center">
						<Button
							variant="outline"
							className="flex items-center space-x-1 border-input"
						>
							<span>Comparer</span>
							<RiPulseLine size={20} />
						</Button>
						<Button
							variant="outline"
							className="flex items-center space-x-1 border-input"
						>
							<span>Exporter</span>
							<RiFileExcel2Line size={20} />
						</Button>
					</div>
				</Header>
			}
		>
			<div className="mt-5 space-y-4">
				<LineChartCard />
				<div className="grid lg:grid-cols-3 sm:grid-cols-1 gap-4">
					<PieChartCard title="Départements" />
					<PieChartCard title="Tribus" />
					<PieChartCard title="Familles d'honneur" />
				</div>
			</div>
		</MainContent>
	)
}

export default AdminDashboard
