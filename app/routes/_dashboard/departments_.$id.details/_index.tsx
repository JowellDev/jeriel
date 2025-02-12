import { useLoaderData } from '@remix-run/react'
import { RiAddLine, RiArrowDownSLine } from '@remixicon/react'
import { MainContent } from '~/components/layout/main-content'
import { Card } from '~/components/ui/card'
import type { SpeedDialAction } from '~/components/layout/mobile/speed-dial-menu'
import { useDepartmentDetails } from './hooks/use-department-details'
import { Header, MemberInfo } from './components/header'
import { MemberFormDialog } from './components/form/member-form'
import UploadFormDialog from './components/form/upload-form'
import { AssistantFormDialog } from './components/form/assistant-form'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'
import { loaderFn } from './loader.server'
import { actionFn } from './action.server'
import { StatsToolbar, TableToolbar, Views } from '~/components/toolbar'
import { AnimatePresence, motion } from 'framer-motion'
import { Statistics } from '~/components/stats/statistics'
import { renderTable } from '~/shared/member-table/table.utlis'
import { FilterForm } from '~/shared/forms/filter-form'

const SPEED_DIAL_ACTIONS = {
	ADD_MEMBER: 'add-member',
}

const SPEED_DIAL_ITEMS: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Créer un fidèle',
		action: SPEED_DIAL_ACTIONS.ADD_MEMBER,
	},
]

export const loader = loaderFn
export const action = actionFn
export const meta = () => [{ title: 'Gestion des départements' }]

export default function DepartmentDetails() {
	const loaderData = useLoaderData<typeof loader>()

	const {
		data,
		view,
		currentMonth,
		setView,
		statView,
		setStatView,
		openManualForm,
		setOpenManualForm,
		openUploadForm,
		setOpenUploadForm,
		openAssistantForm,
		setOpenAssistantForm,
		handleClose,
		handleSearch,
		handleShowMoreTableData,
		membersOption,
		openFilterForm,
		setOpenFilterForm,
		handleFilterChange,
	} = useDepartmentDetails(loaderData)

	function onExport() {
		//
	}

	return (
		<MainContent
			headerChildren={
				<Header
					name={data.department.name}
					membersCount={data.membersCount}
					managerName={data.department.manager.name}
					assistants={data.assistants}
					onOpenAssistantForm={() => setOpenAssistantForm(true)}
				>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="hidden sm:flex items-center" variant="primary">
								<span>Ajouter un fidèle</span>
								<RiArrowDownSLine size={20} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="mr-3">
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
							managerName={data.department.manager.name}
							assistants={data.assistants}
							onOpenAssistantForm={() => setOpenAssistantForm(true)}
						/>
					</div>
				</Header>
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

			{view === Views.STAT ? (
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
							disabled={data.filterData.take === data.total}
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
					departmentId={data.department.id}
				/>
			)}

			{openUploadForm && <UploadFormDialog onClose={handleClose} />}

			{openAssistantForm && (
				<AssistantFormDialog
					onClose={handleClose}
					departmentId={data.department.id}
					membersOption={membersOption}
				/>
			)}

			{openFilterForm && (
				<FilterForm
					onClose={() => setOpenFilterForm(false)}
					onFilter={handleFilterChange}
					filterData={data.filterData}
				/>
			)}

			<SpeedDialMenu
				items={SPEED_DIAL_ITEMS}
				onClick={action => {
					if (action === SPEED_DIAL_ACTIONS.ADD_MEMBER) {
						setOpenManualForm(true)
					}
				}}
			/>
		</MainContent>
	)
}
