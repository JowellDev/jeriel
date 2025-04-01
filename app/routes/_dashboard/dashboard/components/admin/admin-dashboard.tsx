import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { RiFileExcel2Line, RiPulseLine } from '@remixicon/react'
import { LineChartCard } from './line-chart-card'
import type { LoaderType } from '../../loader.server'
import type { SerializeFrom } from '@remix-run/node'
import {
	calculateEntityTotals,
	generateLineChartData,
} from '../../utils/generate-data'
import type { AttendanceAdminStats } from '../../types'
import { type StatisticItem } from '~/components/stats/pie-statistics'
import { StatisticsCard } from './pie-chart-card'
import { useState } from 'react'
import { CompareComponent } from './compare'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import { adminDialItems } from '../../constants'
import YearPicker from '~/components/form/year-picker'

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
		adminEntityStats?.departments ?? [],
	)
	const departmentStats: StatisticItem[] = [
		{ name: 'Nouveaux', value: departmentTotals.newMembers, color: '#3BC9BF' },
		{ name: 'Anciens', value: departmentTotals.oldMembers, color: '#F68D2B' },
	]

	const tribeTotals = calculateEntityTotals(adminEntityStats?.tribes ?? [])
	const tribeStats: StatisticItem[] = [
		{ name: 'Nouveaux', value: tribeTotals.newMembers, color: '#3BC9BF' },
		{ name: 'Anciens', value: tribeTotals.oldMembers, color: '#F68D2B' },
	]

	const familyTotals = calculateEntityTotals(
		adminEntityStats?.honorFamilies ?? [],
	)
	const familyStats: StatisticItem[] = [
		{ name: 'Nouveaux', value: familyTotals.newMembers, color: '#3BC9BF' },
		{ name: 'Anciens', value: familyTotals.oldMembers, color: '#F68D2B' },
	]

	const [openCompare, setOpenCompare] = useState(false)

	return (
		<MainContent
			headerChildren={
				<Header title="Tableau de bord" userName={user.name}>
					<div className="hidden sm:flex sm:space-x-2 sm:items-center">
						<YearPicker
							onChange={date => console.log(date)}
							minYear={2010}
							maxYear={2030}
						/>
						<Button
							variant="outline"
							className="flex items-center space-x-1 border-input"
							onClick={() => setOpenCompare(true)}
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
					<StatisticsCard
						title="Départements"
						statistics={departmentStats}
						total={departmentTotals.newMembers + departmentTotals.oldMembers}
					/>
					<StatisticsCard
						title="Tribus"
						statistics={tribeStats}
						total={tribeTotals.newMembers + tribeTotals.oldMembers}
					/>
					<StatisticsCard
						title="Familles d'honneur"
						statistics={familyStats}
						total={familyTotals.newMembers + familyTotals.oldMembers}
					/>
				</div>
			</div>
			{openCompare && (
				<CompareComponent onClose={() => setOpenCompare(false)} />
			)}
			<SpeedDialMenu
				items={adminDialItems}
				onClick={() => setOpenCompare(true)}
			/>
		</MainContent>
	)
}

export default AdminDashboard
