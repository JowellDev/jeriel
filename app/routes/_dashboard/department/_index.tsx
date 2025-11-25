import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { type MetaFunction } from '@remix-run/node'
import { TableToolbar } from '~/components/toolbar'
import { RiAddLine, RiArrowDownSLine } from '@remixicon/react'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { loaderFn } from './loader.server'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { useDepartment } from './hooks/use-department'
import { useLoaderData } from '@remix-run/react'
import { EditAssistantForm } from '../departments_.$id.details/components/form/edit-assistant-form'
import UploadFormDialog from '../departments_.$id.details/components/form/upload-member-form'
import { EditMemberForm } from '../departments_.$id.details/components/form/edit-member-form'
import AttendanceFormDialog from '../../../shared/attendance-form/form/attendance-form'
import { AttendanceReportEntity } from '@prisma/client'
import { Header } from '~/components/layout/header'
import { FilterForm } from '~/shared/forms/filter-form'
import { renderTable } from '~/shared/member-table/table.utlis'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export const SPEED_DIAL_ACTIONS = {
	ADD_MEMBER: 'add-member',
	MARK_PRESENCE: 'mark-presence',
}

const SPEED_DIAL_ITEMS: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Créer un fidèle',
		action: SPEED_DIAL_ACTIONS.ADD_MEMBER,
	},
	{
		Icon: RiAddLine,
		label: 'Marquer la présence',
		action: SPEED_DIAL_ACTIONS.MARK_PRESENCE,
	},
]

export const meta: MetaFunction = () => [{ title: 'Jeriel | Mon départment' }]

export const loader = loaderFn

export default function Department() {
	const loaderData = useLoaderData<typeof loaderFn>()

	const {
		data,
		view,
		currentMonth,
		membersOption,
		openFilterForm,
		openUploadForm,
		openManualForm,
		openAssistantForm,
		openAttendanceForm,
		setView,
		handleClose,
		handleSearch,
		handleExport,
		setOpenManualForm,
		setOpenFilterForm,
		setOpenUploadForm,
		handleFilterChange,
		setOpenAttendanceForm,
		handleShowMoreTableData,
	} = useDepartment(loaderData)

	function handleSpeedDialMenuAction(action: string) {
		if (action === SPEED_DIAL_ACTIONS.ADD_MEMBER) setOpenManualForm(true)
		if (action === SPEED_DIAL_ACTIONS.MARK_PRESENCE) setOpenAttendanceForm(true)
	}

	return (
		<MainContent
			headerChildren={
				<Header title="Département">
					<div className="flex items-center space-x-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									className="hidden sm:flex items-center border-input"
									variant="outline"
								>
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
						<Button
							className="hidden sm:flex items-center"
							variant="primary"
							onClick={() => setOpenAttendanceForm(true)}
						>
							Marquer la présence
						</Button>
					</div>
				</Header>
			}
		>
			<div className="space-y-2 mb-4">
				<TableToolbar
					view={view}
					excludeOptions={['STAT']}
					setView={setView}
					onSearch={view !== 'STAT' ? handleSearch : undefined}
					onFilter={view !== 'STAT' ? () => setOpenFilterForm(true) : undefined}
					onExport={view !== 'STAT' ? handleExport : undefined}
				/>
			</div>
			<Card className="space-y-2 pb-4 mb-2">
				{renderTable({
					view: view,
					data: data?.membersAttendances,
					currentMonth: currentMonth,
				})}

				<div className="flex justify-center">
					<Button
						size="sm"
						type="button"
						variant="ghost"
						disabled={data.membersAttendances.length === data.total}
						className="bg-neutral-200 rounded-full"
						onClick={handleShowMoreTableData}
					>
						Voir plus
					</Button>
				</div>
			</Card>

			{openManualForm && (
				<EditMemberForm
					onClose={handleClose}
					departmentId={data.department.id}
				/>
			)}

			{openUploadForm && <UploadFormDialog onClose={handleClose} />}

			{openAssistantForm && (
				<EditAssistantForm
					onClose={handleClose}
					departmentId={data.department.id}
					membersOption={membersOption}
				/>
			)}

			{openAttendanceForm && (
				<AttendanceFormDialog
					onClose={handleClose}
					entity={AttendanceReportEntity.DEPARTMENT}
					entityIds={{ departmentId: data.department.id }}
					members={data.departmentMembers}
					services={data.services}
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
				items={SPEED_DIAL_ITEMS}
				onClick={handleSpeedDialMenuAction}
			/>
		</MainContent>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
