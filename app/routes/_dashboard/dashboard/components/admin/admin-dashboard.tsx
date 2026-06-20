import { type ReactNode, useCallback, useEffect, useState } from 'react'
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
import { WelcomeHero } from '~/components/stats/welcome-hero'
import { QuickActions } from './quick-actions'

function computePresenceInsight(stats: unknown) {
	if (!Array.isArray(stats) || stats.length !== 12) return null
	const rate = (s: AttendanceAdminStats) => {
		const total = s.presences + s.absences
		return total > 0 ? Math.round((s.presences / total) * 100) : null
	}
	const month = new Date().getMonth()
	const current = stats[month]
		? rate(stats[month] as AttendanceAdminStats)
		: null
	const previous =
		month > 0 && stats[month - 1]
			? rate(stats[month - 1] as AttendanceAdminStats)
			: null
	return {
		rate: current,
		delta: current != null && previous != null ? current - previous : null,
	}
}

function SectionTitle({ children }: Readonly<{ children: ReactNode }>) {
	return <h3 className="text-base font-semibold text-foreground">{children}</h3>
}

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
	const totalMembers = data.adminEntityStats?.totalMembers ?? 0
	const newMembers = data.adminEntityStats?.newMembers ?? 0
	const insight = computePresenceInsight(data.attendanceStats)

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
			<div className="mt-2 space-y-6 pb-4">
				<WelcomeHero
					userName={data.user.name}
					stats={[
						{
							label: 'Présence ce mois',
							value: insight?.rate != null ? `${insight.rate}%` : '—',
							delta: insight?.delta ?? null,
						},
						{ label: 'Nouveaux fidèles', value: newMembers },
					]}
				/>

				<QuickActions />

				<section className="space-y-3">
					<SectionTitle>Vue d'ensemble</SectionTitle>
					<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
						<KpiCard
							label="Fidèles"
							value={totalMembers}
							Icon={RiGroupLine}
							to="/members"
							trend={
								newMembers > 0
									? {
											label: `${newMembers} nouveau${newMembers > 1 ? 'x' : ''} ce mois`,
											direction: 'up',
										}
									: undefined
							}
						/>
						<KpiCard
							label="Départements"
							value={departmentsCount}
							Icon={RiBuilding2Line}
							to="/departments"
						/>
						<KpiCard
							label="Tribus"
							value={tribesCount}
							Icon={RiGroup3Line}
							to="/tribes"
						/>
						<KpiCard
							label="Familles d'honneur"
							value={familiesCount}
							Icon={RiHeartsLine}
							to="/honor-families"
						/>
					</div>
				</section>

				<section className="space-y-3">
					<SectionTitle>Évolution des présences</SectionTitle>
					<LineChartCard
						data={lineChartData.data}
						config={lineChartData.config}
					/>
				</section>

				<section className="space-y-3">
					<SectionTitle>Répartition par entité</SectionTitle>
					<div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
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
				</section>
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
