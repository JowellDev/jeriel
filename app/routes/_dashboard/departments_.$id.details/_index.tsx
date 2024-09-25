import { useLoaderData } from '@remix-run/react'
import { RiAddLine, RiArrowDownSLine } from '@remixicon/react'
import { MainContent } from '~/components/layout/main-content'
import { Card } from '~/components/ui/card'
import type { SpeedDialAction } from '~/components/layout/mobile/speed-dial-menu'
import { useDepartmentDetails } from './hooks/use-department-details'
import { Header } from './components/header'
import { TableContent } from './components/table-content'
import { StatContent } from './components/statistics/stat-content'
import { MemberFormDialog } from './components/member-form'
import UploadFormDialog from './components/upload-form'
import { AssistantFormDialog } from './components/assistant-form'
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
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { TableToolbar, Views } from '~/components/toolbar'

const SPEED_DIAL_ACTIONS = {
	ADD_MEMBER: 'add-member',
	SHOW_FILTER: 'show-filter',
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
	} = useDepartmentDetails(loaderData)

	function onFilter() {
		//
	}

	function onExport() {
		//
	}

	return (
		<MainContent
			headerChildren={
				<Header
					name={data.department.name}
					membersCount={data.total}
					managerName={data.department.manager.name}
					assistants={data.assistants}
					onOpenAssistantForm={() => setOpenAssistantForm(true)}
				>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="hidden sm:flex items-center" variant="gold">
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
				</Header>
			}
		>
			<div className="space-y-2 mb-4">
				<TableToolbar
					view={view}
					setView={setView}
					onSearch={view !== 'STAT' ? handleSearch : undefined}
					onFilter={view !== 'STAT' ? onFilter : undefined}
					onExport={view !== 'STAT' ? onExport : undefined}
				/>
			</div>

			{(view === Views.CULTE || view === Views.SERVICE) && (
				<Card className="space-y-2 pb-4 mb-2">
					<TableContent
						data={data.members as unknown as MemberMonthlyAttendances[]}
						departmentId={data.department.id}
						total={data.total}
						onShowMore={handleShowMoreTableData}
					/>
				</Card>
			)}

			{view === Views.STAT && (
				<StatContent
					statView={statView}
					setStatView={setStatView}
					data={data}
					onSearch={handleSearch}
					onShowMore={handleShowMoreTableData}
					onExport={onExport}
				/>
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

/* <div className="hidden sm:block">
								<SelectInput
									items={statusFilterData}
									placeholder="Statut"
									onChange={value => handleFilterChange('status', value)}
								/>
							</div> */

/* <div className="hidden sm:block">
								<SelectInput
									items={stateFilterData}
									onChange={value => handleFilterChange('state', value)}
									placeholder="Etat"
								/>
							</div> */
