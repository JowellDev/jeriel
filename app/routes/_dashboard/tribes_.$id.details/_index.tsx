import { MainContent } from '~/components/layout/main-content'
import { MemberInfo, TribeHeader } from './components/tribe-header'
import { Button } from '~/components/ui/button'
import { loaderFn } from './loader.server'
import { useLoaderData, type MetaFunction } from '@remix-run/react'
import { Card } from '~/components/ui/card'
import { RiAddLine, RiArrowDownSLine } from '@remixicon/react'
import { TribeStatistics } from './components/statistics/tribe-statistics'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'

import type { Member, MemberMonthlyAttendances } from '~/models/member.model'
import { MemberFormDialog } from './components/member-form'
import { actionFn } from './action.server'
import { AssistantFormDialog } from './components/assistant-form'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { UploadFormDialog } from './components/upload-form'
import { renderTable } from './utils/table.utlis'
import { StatsToolbar, TableToolbar } from '~/components/toolbar'
import { useTribeDetails } from './hooks'

const speedDialItemsActions = {
	ADD_MEMBER: 'add-member',
	SHOW_FILTER: 'show-filter',
}

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Créer un fidèle',
		action: speedDialItemsActions.ADD_MEMBER,
	},
]

export const meta: MetaFunction = () => [{ title: 'Gestion des Tribus' }]

export const loader = loaderFn

export const action = actionFn

export default function TribeDetails() {
	const loaderData = useLoaderData<typeof loader>()

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
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="hidden sm:flex items-center" variant={'gold'}>
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
				<div className="space-y-4 mb-2">
					<TribeStatistics />
					<StatsToolbar
						title="Suivi des nouveaux fidèles"
						view={statView}
						setView={setStatView}
						onSearch={handleSearch}
						onExport={onExport}
					></StatsToolbar>
					{renderTable({
						view,
						statView,
						data: data.members as unknown as MemberMonthlyAttendances[],
					})}
				</div>
			) : (
				<Card className="space-y-2 pb-4 mb-2">
					{renderTable({
						view,
						statView,
						data: data.members as unknown as MemberMonthlyAttendances[],
					})}
				</Card>
			)}
			<div className="flex justify-center">
				<Button
					size="sm"
					type="button"
					variant="ghost"
					className="bg-neutral-200 rounded-full"
					disabled={data.members.length === data.total}
					onClick={handleShowMoreTableData}
				>
					Voir plus
				</Button>
			</div>

			{openManualForm && (
				<MemberFormDialog onClose={handleClose} tribeId={data.tribe.id} />
			)}

			{openUploadForm && <UploadFormDialog onClose={handleClose} />}

			{openAssistantForm && (
				<AssistantFormDialog
					onClose={handleClose}
					tribeId={data.tribe.id}
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
