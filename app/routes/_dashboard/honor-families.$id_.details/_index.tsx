import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { actionFn } from './action.server'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { StatsToolbar, TableToolbar } from '~/components/toolbar'
import { RiArrowDownSLine } from '@remixicon/react'
import { motion, AnimatePresence } from 'framer-motion'
import { MemberFormDialog } from './components/member-form'
import { UploadFormDialog } from './components/upload-form'
import { type LoaderData, loaderFn } from './loader.server'
import { FilterFormDialog } from './components/filter-form'
import { MainContent } from '~/components/layout/main-content'
import { AssistantFormDialog } from './components/assistant-form'
import { FORM_INTENT, speedDialItems, speedDialItemsActions } from './constants'
import { type MetaFunction, useFetcher, useLoaderData } from '@remix-run/react'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import { useHonorFamilyDetails } from './hooks/use-honor-family-details'
import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { useState } from 'react'
import { useDownloadFile } from '~/shared/hooks'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { renderTable } from '~/shared/member-table/table.utlis'
import { DetailsHeader, MemberInfo } from '~/components/layout/details-header'
import AdminStatistics from '~/components/stats/admin/admin-statistics'

export const meta: MetaFunction = () => [
	{ title: 'Membres de la famille d’honneur' },
]

export const loader = loaderFn
export const action = actionFn

const VIEWS = [
	{
		id: 'CULTE' as const,
		label: 'Culte',
	},
	{
		id: 'MEETING' as const,
		label: 'Réunion',
	},
	{
		id: 'STAT' as const,
		label: 'Statistiques',
	},
]

export default function HonorFamily() {
	const loaderData = useLoaderData<LoaderData>()
	const fetcher = useFetcher({ key: 'honor-family-details' })
	const [isExporting, setIsExporting] = useState(false)

	const {
		view,
		statView,
		currentMonth,
		filterData,
		honorFamily,
		searchParams,
		membersOption,
		openFilterForm,
		openManualForm,
		openUploadForm,
		openAssistantForm,
		setView,
		setStatView,
		handleClose,
		handleSearch,
		setOpenManualForm,
		setOpenUploadForm,
		setOpenFilterForm,
		handleFilterChange,
		setOpenAssistantForm,
		handleShowMoreTableData,
		memberStats,
		handleOnPeriodChange,
		isFetching,
	} = useHonorFamilyDetails(loaderData)

	useDownloadFile(fetcher, { isExporting, setIsExporting })

	const handleSpeedDialItemClick = (action: string) => {
		switch (action) {
			case speedDialItemsActions.CREATE_MEMBER:
				return setOpenManualForm(true)
			case speedDialItemsActions.UPLOAD_MEMBERS:
				return setOpenUploadForm(true)
			default:
				break
		}
	}

	function handleShowFilterForm() {
		setOpenFilterForm(true)
	}

	function onExport() {
		setIsExporting(true)
		fetcher.submit({ intent: FORM_INTENT.EXPORT }, { method: 'post' })
	}

	return (
		<MainContent
			headerChildren={
				<DetailsHeader
					name={honorFamily.name}
					managerName={honorFamily.manager?.name ?? 'N/A'}
					membersCount={honorFamily.total}
					assistants={honorFamily.assistants as unknown as Member[]}
					onOpenAssistantForm={() => setOpenAssistantForm(true)}
				>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="hidden sm:flex items-center"
								variant={'primary'}
							>
								<span>Ajouter un fidèle</span>
								<RiArrowDownSLine size={20} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="mr-3 ">
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => setOpenManualForm(true)}
							>
								Ajouter manuellement
							</DropdownMenuItem>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => setOpenUploadForm(true)}
							>
								Importer un fichier
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<div className="block sm:hidden">
						<MemberInfo
							isDesktop={false}
							membersCount={honorFamily.total}
							managerName={honorFamily.manager?.name ?? 'N/A'}
							assistants={honorFamily.assistants as unknown as Member[]}
							onOpenAssistantForm={() => setOpenAssistantForm(true)}
						/>
					</div>
				</DetailsHeader>
			}
		>
			<div className="space-y-2 mb-4">
				<TableToolbar
					views={VIEWS}
					view={view}
					searchQuery={searchParams.get('query') ?? ''}
					setView={setView}
					onSearch={view !== 'STAT' ? handleSearch : undefined}
					onFilter={view !== 'STAT' ? handleShowFilterForm : undefined}
					onExport={view !== 'STAT' ? onExport : undefined}
					onDateSelect={view === 'STAT' ? handleOnPeriodChange : undefined}
					onPeriodChange={handleOnPeriodChange}
					align="end"
					isExporting={isExporting}
					canExport={honorFamily.total > 0}
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
							className="overflow-x-visible grid grid-cols-2 gap-4"
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
							views={VIEWS}
							title="Suivi des nouveaux fidèles"
							view={statView}
							setView={setStatView}
							onSearch={handleSearch}
							onExport={onExport}
							isExporting={isExporting}
							canExport={honorFamily.total > 0}
						></StatsToolbar>
					</div>
					<Card className="space-y-2 mb-4">
						{renderTable({
							view,
							statView,
							data: honorFamily.members as unknown as MemberMonthlyAttendances[],
							currentMonth: currentMonth,
						})}
					</Card>
				</AnimatePresence>
			) : (
				<Card className="space-y-2 mb-4">
					{renderTable({
						view,
						statView,
						data: honorFamily.members as unknown as MemberMonthlyAttendances[],
						currentMonth: currentMonth,
					})}
					<div className="flex justify-center pb-2">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
							onClick={handleShowMoreTableData}
							disabled={filterData.take >= honorFamily.total}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			)}

			{openFilterForm && (
				<FilterFormDialog
					filterData={filterData}
					onClose={handleClose}
					onFilter={handleFilterChange}
				/>
			)}

			{openManualForm && (
				<MemberFormDialog
					onClose={handleClose}
					honorFamilyId={honorFamily.id}
				/>
			)}

			{openUploadForm && <UploadFormDialog onClose={handleClose} />}

			{openAssistantForm && (
				<AssistantFormDialog
					onClose={handleClose}
					honorFamilyId={honorFamily.id}
					membersOption={membersOption}
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
