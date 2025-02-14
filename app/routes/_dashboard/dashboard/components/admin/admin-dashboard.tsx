import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { RiFileExcel2Line, RiPulseLine } from '@remixicon/react'
import { LineChartCard } from './line-chart-card'
import { PieChartCard } from './pie-chart-card'
import type { LoaderType } from '../../loader.server'
import type { SerializeFrom } from '@remix-run/node'
import {
	generateLineChartData,
	generatePieChartData,
} from '../../utils/generate-data'
import type { AttendanceStats, EntityStats } from '../../types'

type LoaderReturnData = SerializeFrom<LoaderType>

interface DashboardProps {
	loaderData: LoaderReturnData
}

function AdminDashboard({ loaderData }: Readonly<DashboardProps>) {
	const { user, adminEntityStats, attendanceStats } = loaderData

	const lineChartData = generateLineChartData(
		attendanceStats as unknown as AttendanceStats[],
	)
	const membershipData = generatePieChartData(
		adminEntityStats as unknown as EntityStats,
	)

	// const { departments, tribes, honorFamilies } = adminEntityStats

	return (
		<MainContent
			headerChildren={
				<Header title="Tableau de bord" userName={user.name}>
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
				<LineChartCard
					data={lineChartData.data}
					config={lineChartData.config}
				/>
				<div className="grid lg:grid-cols-3 sm:grid-cols-1 gap-4">
					<PieChartCard
						title="Départements"
						data={membershipData.data}
						config={membershipData.config}
						newCount={adminEntityStats?.newMembers ?? 0}
						oldCount={adminEntityStats?.oldMembers ?? 0}
					/>
					<PieChartCard
						title="Tribus"
						data={membershipData.data}
						config={membershipData.config}
						newCount={adminEntityStats?.newMembers ?? 0}
						oldCount={adminEntityStats?.oldMembers ?? 0}
					/>
					<PieChartCard
						title="Familles d'honneur"
						data={membershipData.data}
						config={membershipData.config}
						newCount={adminEntityStats?.newMembers ?? 0}
						oldCount={adminEntityStats?.oldMembers ?? 0}
					/>
				</div>
			</div>
		</MainContent>
	)
}

export default AdminDashboard
