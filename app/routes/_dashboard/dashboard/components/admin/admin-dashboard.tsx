import { useCallback, useEffect, useState } from 'react'
import { useFetcher, type useLoaderData } from '@remix-run/react'
import {
	RiBuilding2Line,
	RiFileExcel2Line,
	RiGroup3Line,
	RiGroupLine,
	RiHeartsLine,
	RiPulseLine,
} from '@remixicon/react'

import { buildSearchParams } from '~/utils/url'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { KpiCard } from '~/components/stats/kpi-card'
import { type StatisticItem } from '~/components/stats/pie-statistics'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import YearPicker from '~/components/form/year-picker'

import type { LoaderType } from '../../loader.server'
import {
	calculateEntityTotals,
	generateLineChartData,
} from '../../utils/generate-data'
import type { AttendanceAdminStats } from '../../types'
import { adminDialItems } from '../../constants'
import { LineChartCard } from './line-chart-card'
import { StatisticsCard } from './pie-chart-card'
import { CompareComponent } from './compare'

interface DashboardProps {
	loaderData: ReturnType<typeof useLoaderData<LoaderType>>
}

function AdminDashboard({ loaderData }: Readonly<DashboardProps>) {
	const [data, setData] = useState(loaderData)
	const { load, ...fetcher } = useFetcher<LoaderType>()

	const reloadData = useCallback(
		(data: { yearDate: Date }) => {
			const params = buildSearchParams(data)
			load(`${location.pathname}?${params}`)
		},
		[load],
	)

	const lineChartData = generateLineChartData(
		data.attendanceStats as AttendanceAdminStats[],
	)
	const departmentTotals = calculateEntityTotals(
		data.adminEntityStats?.departments ?? [],
	)
	const departmentStats: StatisticItem[] = [
		{ name: 'Nouveaux', value: departmentTotals.newMembers, color: '#3BC9BF' },
		{ name: 'Anciens', value: departmentTotals.oldMembers, color: '#F68D2B' },
	]

	const tribeTotals = calculateEntityTotals(data.adminEntityStats?.tribes ?? [])
	const tribeStats: StatisticItem[] = [
		{ name: 'Nouveaux', value: tribeTotals.newMembers, color: '#3BC9BF' },
		{ name: 'Anciens', value: tribeTotals.oldMembers, color: '#F68D2B' },
	]

	const familyTotals = calculateEntityTotals(
		data.adminEntityStats?.honorFamilies ?? [],
	)
	const familyStats: StatisticItem[] = [
		{ name: 'Nouveaux', value: familyTotals.newMembers, color: '#3BC9BF' },
		{ name: 'Anciens', value: familyTotals.oldMembers, color: '#F68D2B' },
	]

	const [openCompare, setOpenCompare] = useState(false)

	const departmentsCount = data.adminEntityStats?.departments?.length ?? 0
	const tribesCount = data.adminEntityStats?.tribes?.length ?? 0
	const familiesCount = data.adminEntityStats?.honorFamilies?.length ?? 0
	const totalMembers =
		departmentTotals.newMembers +
		departmentTotals.oldMembers +
		tribeTotals.newMembers +
		tribeTotals.oldMembers +
		familyTotals.newMembers +
		familyTotals.oldMembers

	function handleYearChange(date: Date) {
		reloadData({ yearDate: date })
	}

	useEffect(() => {
		if (loaderData) setData(loaderData)
	}, [loaderData])

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	return (
		<MainContent
			headerChildren={
				<Header title="Tableau de bord" userName={data.user.name}>
					<div className="hidden sm:flex sm:space-x-2 sm:items-center">
						<YearPicker onChange={handleYearChange} />
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
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<KpiCard
						label="Fidèles"
						value={totalMembers}
						Icon={RiGroupLine}
						hint="Tous les fidèles"
					/>
					<KpiCard
						label="Départements"
						value={departmentsCount}
						Icon={RiBuilding2Line}
					/>
					<KpiCard label="Tribus" value={tribesCount} Icon={RiGroup3Line} />
					<KpiCard
						label="Familles d'honneur"
						value={familiesCount}
						Icon={RiHeartsLine}
					/>
				</div>
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
