import { type MetaFunction, useLoaderData } from '@remix-run/react'
import {
	RiBarChartBoxLine,
	RiFileListLine,
	RiPulseLine,
	RiShieldCheckLine,
} from '@remixicon/react'

import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

import { loaderFn } from './server/loader.server'
import { actionFn } from './server/action.server'
import type { AnalyticsTab, ExportDataset } from './constants'
import { useAnalyticsNav } from './hooks/use-analytics-nav'
import { AnalyticsToolbar } from './components/analytics-toolbar'
import { OverviewTab } from './components/tabs/overview-tab'
import { AttendanceTab } from './components/tabs/attendance-tab'
import { ReportsTab } from './components/tabs/reports-tab'
import { DataQualityTab } from './components/tabs/data-quality-tab'
import { EmptyState } from './components/section-card'

export const meta: MetaFunction = () => [{ title: 'Analytique | Jeriel' }]

export const loader = loaderFn
export const action = actionFn

const TAB_DEFS: { value: AnalyticsTab; label: string; Icon: typeof RiPulseLine }[] =
	[
		{ value: 'overview', label: "Vue d'ensemble", Icon: RiBarChartBoxLine },
		{ value: 'attendance', label: 'Assiduité & risque', Icon: RiPulseLine },
		{ value: 'reports', label: 'Rapports', Icon: RiFileListLine },
		{ value: 'quality', label: 'Qualité', Icon: RiShieldCheckLine },
	]

const TAB_EXPORTS: Record<
	AnalyticsTab,
	{ dataset: ExportDataset; label: string }[]
> = {
	overview: [],
	attendance: [
		{ dataset: 'at-risk', label: 'À risque' },
		{ dataset: 'attendance', label: 'Assiduité' },
	],
	reports: [],
	quality: [{ dataset: 'incomplete', label: 'Fiches' }],
}

export default function AnalyticsPage() {
	const data = useLoaderData<typeof loaderFn>()
	const { update } = useAnalyticsNav()
	const { scope, filter } = data

	function handleEntityChange(value: string) {
		const [entityType, entityId] = value.split(':')
		update({ entityType, entityId })
	}

	function handlePeriodChange(range: { from: Date; to: Date }) {
		update({ from: range.from.toISOString(), to: range.to.toISOString() })
	}

	const noEntity = !scope.isAdmin && !scope.selectedEntity

	return (
		<MainContent
			headerChildren={
				<Header title="Analytique" userName={data.user.name}>
					<div className="hidden sm:block">
						<AnalyticsToolbar
							scope={scope}
							filter={filter}
							exports={TAB_EXPORTS[filter.tab]}
							onEntityChange={handleEntityChange}
							onPeriodChange={handlePeriodChange}
						/>
					</div>
				</Header>
			}
		>
			<div className="mt-2 space-y-4 pb-6">
				<p className="text-sm text-muted-foreground">
					Périmètre : <span className="font-medium text-foreground">{scope.label}</span>
				</p>

				<div className="sm:hidden">
					<AnalyticsToolbar
						scope={scope}
						filter={filter}
						exports={TAB_EXPORTS[filter.tab]}
						onEntityChange={handleEntityChange}
						onPeriodChange={handlePeriodChange}
					/>
				</div>

				{noEntity ? (
					<EmptyState message="Aucune entité ne vous est rattachée." />
				) : (
					<Tabs
						value={filter.tab}
						onValueChange={value => update({ tab: value })}
						className="w-full"
					>
						<div className="overflow-x-auto">
							<TabsList className="h-auto flex-nowrap">
								{TAB_DEFS.map(tab => (
									<TabsTrigger
										key={tab.value}
										value={tab.value}
										className="flex items-center gap-1.5"
									>
										<tab.Icon size={15} />
										<span className="whitespace-nowrap">{tab.label}</span>
									</TabsTrigger>
								))}
							</TabsList>
						</div>

						<TabsContent value="overview">
							<OverviewTab
								overview={data.overview}
								engagement={data.engagement}
								birthdays={data.birthdays}
							/>
						</TabsContent>
						<TabsContent value="attendance">
							<AttendanceTab attendance={data.attendance} isAdmin={scope.isAdmin} />
						</TabsContent>
						<TabsContent value="reports">
							<ReportsTab reports={data.reports} />
						</TabsContent>
						<TabsContent value="quality">
							<DataQualityTab
								dataQuality={data.dataQuality}
								isAdmin={scope.isAdmin}
							/>
						</TabsContent>
					</Tabs>
				)}
			</div>
		</MainContent>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
