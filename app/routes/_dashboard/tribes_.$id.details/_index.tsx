import { MainContent } from '~/components/layout/main-content'
import {
	MemberInfo,
	DetailsHeader,
} from '../../../components/layout/details-header'
import { Button } from '~/components/ui/button'
import { loaderFn } from './server/loader.server'
import { useFetcher, useLoaderData, type MetaFunction } from '@remix-run/react'
import { Card } from '~/components/ui/card'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import type { Member } from '~/models/member.model'
import { actionFn } from './server/action.server'
import { EditAssistantForm } from './components/forms/edit-assistant-form'
import { renderTable } from '../../../shared/member-table/table.utlis'
import { StatsToolbar, TableToolbar } from '~/components/toolbar'
import { useTribeDetails } from './hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { FilterForm } from '~/shared/forms/filter-form'
import { DropdownMenuComponent } from '~/shared/forms/dropdown-menu'
import { FORM_INTENT, speedDialItems } from './constants'
import { EditEntityMemberForm } from '~/shared/forms/edit-entity-member-form'
import { UploadFormDialog } from '~/shared/forms/upload-member-form'
import AdminStatistics from '~/components/stats/admin/admin-statistics'
import { useDownloadFile } from '~/shared/hooks'
import { useState } from 'react'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export const meta: MetaFunction = () => [
	{ title: 'Jeriel | Membres de la tribu' },
]

export const loader = loaderFn

export const action = actionFn

export default function TribeDetails() {
	const loaderData = useLoaderData<typeof loader>()
	const fetcher = useFetcher<typeof actionFn>()
	const [isExporting, setIsExporting] = useState(false)

	const {
		data,
		view,
		currentMonth,
		setView,
		statView,
		setStatView,
		memberStats,
		isFetching,
		openManualForm,
		setOpenManualForm,
		openUploadForm,
		setOpenUploadForm,
		openAssistantForm,
		setOpenAssistantForm,
		handleSearch,
		handleFilterChange,
		handleShowMoreTableData,
		handleSpeedDialItemClick,
		handleClose,
		openFilterForm,
		setOpenFilterForm,
		// onExport,
		handleOnPeriodChange,
	} = useTribeDetails(loaderData)

	useDownloadFile(fetcher, { isExporting, setIsExporting })

	function onExport() {
		setIsExporting(true)
		fetcher.submit({ intent: FORM_INTENT.EXPORT }, { method: 'post' })
	}

	return (
		<MainContent
			headerChildren={
				<DetailsHeader
					name={data.tribe.name}
					membersCount={data.membersCount}
					managerName={data.tribe.manager?.name ?? 'N/D'}
					assistants={data.tribeAssistants as unknown as Member[]}
					onOpenAssistantForm={() => setOpenAssistantForm(true)}
				>
					<DropdownMenuComponent
						onOpenManuallyForm={() => setOpenManualForm(true)}
						onOpenUploadForm={() => setOpenUploadForm(true)}
					/>
					<div className="block sm:hidden">
						<MemberInfo
							isDesktop={false}
							membersCount={data.total}
							managerName={data.tribe.manager?.name ?? 'N/D'}
							assistants={data.tribeAssistants}
							onOpenAssistantForm={() => setOpenAssistantForm(true)}
						/>
					</div>
				</DetailsHeader>
			}
		>
			<div className="space-y-2 mb-4">
				<TableToolbar
					view={view}
					setView={setView}
					onSearch={view !== 'STAT' ? handleSearch : undefined}
					onFilter={view !== 'STAT' ? () => setOpenFilterForm(true) : undefined}
					onExport={view !== 'STAT' ? onExport : undefined}
					onDateSelect={view === 'STAT' ? handleOnPeriodChange : undefined}
					onPeriodChange={handleOnPeriodChange}
					align="end"
					isExporting={isExporting}
					canExport={data.total > 0}
				/>
			</div>
			{view === 'STAT' ? (
				<AnimatePresence>
					<div className="space-y-4 mb-2">
						<motion.div
							key="stats"
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: 'auto', opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{
								type: 'spring',
								stiffness: 300,
								damping: 30,
								height: {
									duration: 0.4,
								},
							}}
							className="overflow-x-visible grid sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4"
						>
							<div>
								<AdminStatistics
									title="Nouveaux membres"
									members={memberStats?.newMembersStats ?? []}
									isFetching={isFetching}
								/>
							</div>
							<div>
								<AdminStatistics
									title="Anciens membres"
									members={memberStats?.oldMembersStats ?? []}
									isFetching={isFetching}
								/>
							</div>
						</motion.div>

						<StatsToolbar
							title="Suivi des nouveaux fidèles"
							view={statView}
							setView={setStatView}
							onSearch={handleSearch}
							onExport={onExport}
						></StatsToolbar>
						<Card className="space-y-2 pb-4 mb-2">
							{renderTable({
								view,
								statView,
								data: data.members,
								currentMonth: currentMonth,
							})}
						</Card>
					</div>
				</AnimatePresence>
			) : (
				<Card className="space-y-2 pb-4 mb-2">
					{renderTable({
						view,
						statView,
						data: data.members,
						currentMonth: currentMonth,
					})}
					<div className="flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
							disabled={data.filterData.take >= data.total}
							onClick={handleShowMoreTableData}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			)}

			{openManualForm && (
				<EditEntityMemberForm
					onClose={handleClose}
					fetcher={fetcher}
					formAction={`/tribes/${data.tribe.id}/details`}
				/>
			)}

			{openUploadForm && (
				<UploadFormDialog onClose={handleClose} fetcher={fetcher} />
			)}

			{openAssistantForm && (
				<EditAssistantForm onClose={handleClose} tribeId={data.tribe.id} />
			)}

			{openFilterForm && (
				<FilterForm
					filterData={data.filterData}
					onClose={() => setOpenFilterForm(false)}
					onFilter={handleFilterChange}
				/>
			)}

			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
