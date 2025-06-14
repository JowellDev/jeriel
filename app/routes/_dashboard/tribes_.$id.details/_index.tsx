import { MainContent } from '~/components/layout/main-content'
import {
	MemberInfo,
	DetailsHeader,
} from '../../../components/layout/details-header'
import { Button } from '~/components/ui/button'
import { loaderFn } from './loader.server'
import { useFetcher, useLoaderData, type MetaFunction } from '@remix-run/react'
import { Card } from '~/components/ui/card'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import type { Member } from '~/models/member.model'
import { actionFn } from './action.server'
import { AssistantFormDialog } from './components/forms/assistant-form'
import { renderTable } from '../../../shared/member-table/table.utlis'
import { StatsToolbar, TableToolbar } from '~/components/toolbar'
import { useTribeDetails } from './hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { FilterForm } from '~/shared/forms/filter-form'
import { DropdownMenuComponent } from '~/shared/forms/dropdown-menu'
import { speedDialItems } from './constants'
import { MemberFormDialog } from '~/shared/forms/member-form'
import { UploadFormDialog } from '~/shared/forms/upload-form'
import AdminStatistics from '~/components/stats/admin/admin-statistics'

export const meta: MetaFunction = () => [{ title: 'Membres de la tribu' }]

export const loader = loaderFn

export const action = actionFn

export default function TribeDetails() {
	const loaderData = useLoaderData<typeof loader>()
	const fetcher = useFetcher<typeof actionFn>()

	const {
		data,
		view,
		currentMonth,
		setView,
		statView,
		setStatView,
		membersOption,
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
		onExport,
		handleOnPeriodChange,
	} = useTribeDetails(loaderData)

	return (
		<MainContent
			headerChildren={
				<DetailsHeader
					name={data.tribe.name}
					membersCount={data.membersCount}
					managerName={data.tribe.manager?.name ?? 'N/A'}
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
							managerName={data.tribe.manager?.name ?? 'N/A'}
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
				<MemberFormDialog
					onClose={handleClose}
					fetcher={fetcher}
					formAction={`/tribes/${data.tribe.id}/details`}
				/>
			)}

			{openUploadForm && (
				<UploadFormDialog onClose={handleClose} fetcher={fetcher} />
			)}

			{openAssistantForm && (
				<AssistantFormDialog
					onClose={handleClose}
					tribeId={data.tribe.id}
					membersOption={membersOption}
				/>
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
