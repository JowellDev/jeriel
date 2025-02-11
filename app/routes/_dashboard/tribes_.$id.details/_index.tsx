import { MainContent } from '~/components/layout/main-content'
import { MemberInfo, TribeHeader } from './components/tribe-header'
import { Button } from '~/components/ui/button'
import { loaderFn } from './loader.server'
import { useFetcher, useLoaderData, type MetaFunction } from '@remix-run/react'
import { Card } from '~/components/ui/card'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import type { Member } from '~/models/member.model'
import { actionFn } from './action.server'
import { AssistantFormDialog } from './components/forms/assistant-form'
import { renderTable } from './utils/table.utlis'
import { StatsToolbar, TableToolbar } from '~/components/toolbar'
import { useTribeDetails } from './hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Statistics } from '~/components/stats/statistics'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'
import { FilterForm } from '~/shared/tribe/filter-form'
import { DropdownMenuComponent } from '~/shared/tribe/dropdown-menu'
import { speedDialItems } from './constants'
import { MemberFormDialog } from '~/shared/tribe/member-form'
import { UploadFormDialog } from '~/shared/tribe/upload-form'

export const meta: MetaFunction = () => [{ title: 'Gestion des Tribus' }]

export const loader = loaderFn

export const action = actionFn

export default function TribeDetails() {
	const loaderData = useLoaderData<typeof loader>()
	const fetcher = useFetcher<typeof actionFn>()

	const {
		data,
		view,
		setView,
		statView,
		setStatView,
		membersOption,
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
	} = useTribeDetails(loaderData)

	return (
		<MainContent
			headerChildren={
				<TribeHeader
					name={data.tribe.name}
					membersCount={data.membersCount}
					managerName={data.tribe.manager.name}
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
							managerName={data.tribe.manager.name}
							assistants={data.tribeAssistants}
							onOpenAssistantForm={() => setOpenAssistantForm(true)}
						/>
					</div>
				</TribeHeader>
			}
		>
			<div className="space-y-2 mb-4">
				<TableToolbar
					view={view}
					setView={setView}
					onSearch={view !== 'STAT' ? handleSearch : undefined}
					onFilter={view !== 'STAT' ? () => setOpenFilterForm(true) : undefined}
					onExport={view !== 'STAT' ? onExport : undefined}
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
							className="overflow-x-visible"
						>
							<Statistics />
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
					})}
					{data.total > DEFAULT_QUERY_TAKE && (
						<div className="flex justify-center">
							<Button
								size="sm"
								type="button"
								variant="ghost"
								className="bg-neutral-200 rounded-full"
								disabled={data.filterData.take === data.total}
								onClick={handleShowMoreTableData}
							>
								Voir plus
							</Button>
						</div>
					)}
				</Card>
			)}

			{openManualForm && (
				<MemberFormDialog
					onClose={handleClose}
					tribeId={data.tribe.id}
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
