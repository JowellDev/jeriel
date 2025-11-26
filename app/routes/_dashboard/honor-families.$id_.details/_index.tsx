import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { actionFn } from './server/action.server'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { StatsToolbar, TableToolbar } from '~/components/toolbar'
import { RiArrowDownSLine } from '@remixicon/react'
import { motion, AnimatePresence } from 'framer-motion'
import { EditMemberForm } from './components/forms/edit-member-form'
import { UploadMemberForm } from './components/forms/upload-member-form'
import { type LoaderData, loaderFn } from './server/loader.server'
import { FilterForm } from './components/forms/filter-form'
import { MainContent } from '~/components/layout/main-content'
import { EditAssistantForm } from './components/forms/edit-assistant-form'
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

export const loader = loaderFn
export const action = actionFn

export const meta: MetaFunction = () => [
	{ title: "Jeriel | Membres de la famille d'honneur" },
]

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
		data,
		view,
		statView,
		currentMonth,
		searchParams,
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
					name={data.honorFamily.name}
					managerName={data.honorFamily.manager?.name ?? 'N/D'}
					membersCount={data.honorFamily.total}
					assistants={data.honorFamily.assistants as unknown as Member[]}
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
							membersCount={data.honorFamily.total}
							managerName={data.honorFamily.manager?.name ?? 'N/D'}
							assistants={data.honorFamily.assistants as unknown as Member[]}
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
					canExport={data.honorFamily.total > 0}
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
							canExport={data.honorFamily.total > 0}
						></StatsToolbar>
					</div>
					<Card className="space-y-2 mb-4">
						{renderTable({
							view,
							statView,
							data: data.honorFamily
								.members as unknown as MemberMonthlyAttendances[],
							currentMonth: currentMonth,
						})}
					</Card>
				</AnimatePresence>
			) : (
				<Card className="space-y-2 mb-4">
					{renderTable({
						view,
						statView,
						data: data.honorFamily
							.members as unknown as MemberMonthlyAttendances[],
						currentMonth: currentMonth,
					})}

					<div className="flex justify-center pb-2">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
							onClick={handleShowMoreTableData}
							disabled={data.filterData.take >= data.honorFamily.total}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			)}

			{openFilterForm && (
				<FilterForm
					filterData={data.filterData}
					onClose={handleClose}
					onFilter={handleFilterChange}
				/>
			)}

			{openManualForm && (
				<EditMemberForm
					onClose={handleClose}
					honorFamilyId={data.honorFamily.id}
				/>
			)}

			{openUploadForm && <UploadMemberForm onClose={handleClose} />}

			{openAssistantForm && (
				<EditAssistantForm
					onClose={handleClose}
					honorFamilyId={data.honorFamily.id}
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
