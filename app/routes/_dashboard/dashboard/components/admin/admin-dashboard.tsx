import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { RiFileExcel2Line, RiPulseLine } from '@remixicon/react'
import { LineChartCard } from './line-chart-card'
import { PieChartCard } from './pie-chart-card'
import type { LoaderType } from '../../loader.server'
import type { SerializeFrom } from '@remix-run/node'
import {
	calculateEntityTotals,
	generateLineChartData,
	generatePieChartData,
} from '../../utils/generate-data'
import type { AttendanceAdminStats, EntityWithStats } from '../../types'

type LoaderReturnData = SerializeFrom<LoaderType>

interface DashboardProps {
	loaderData: LoaderReturnData
}

function AdminDashboard({ loaderData }: Readonly<DashboardProps>) {
	const { user, adminEntityStats, attendanceStats } = loaderData

	const lineChartData = generateLineChartData(
		attendanceStats as AttendanceAdminStats[],
	)
	const departmentTotals = calculateEntityTotals(
		adminEntityStats?.departments as EntityWithStats[],
	)
	const departmentData = generatePieChartData(
		departmentTotals?.newMembers,
		departmentTotals?.oldMembers,
	)

	const tribeTotals = calculateEntityTotals(
		adminEntityStats?.tribes as EntityWithStats[],
	)
	const tribeData = generatePieChartData(
		tribeTotals?.newMembers,
		tribeTotals?.oldMembers,
	)

	const familyTotals = calculateEntityTotals(
		adminEntityStats?.honorFamilies as EntityWithStats[],
	)
	const familyData = generatePieChartData(
		familyTotals?.newMembers,
		familyTotals?.oldMembers,
	)

	return (
		<MainContent
			headerChildren={
				<Header title="Tableau de bord" userName={user.name}>
					<div className="hidden sm:flex sm:space-x-2 sm:items-center">
						<Button
							variant="outline"
							disabled={true}
							className="flex items-center space-x-1 border-input"
						>
							<span>Comparer</span>
							<RiPulseLine size={20} />
						</Button>
						<Button
							variant="outline"
							disabled={true}
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
						data={departmentData?.data}
						config={departmentData.config}
						newCount={departmentTotals.newMembers}
						oldCount={departmentTotals.oldMembers}
					/>
					<PieChartCard
						title="Tribus"
						data={tribeData?.data}
						config={tribeData.config}
						newCount={tribeTotals.newMembers}
						oldCount={tribeTotals.oldMembers}
					/>
					<PieChartCard
						title="Familles d'honneur"
						data={familyData?.data}
						config={familyData.config}
						newCount={familyTotals.newMembers}
						oldCount={familyTotals.oldMembers}
					/>
				</div>
			</div>
		</MainContent>
	)
}

export default AdminDashboard
