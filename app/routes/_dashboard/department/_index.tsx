import { Header, MemberInfo } from './components/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { type MetaFunction } from '@remix-run/node'
import { TableToolbar, Views } from '~/components/toolbar'
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
import { TableContent } from './components/table-content'
import { useDepartment } from './hooks/use-department'
import { useLoaderData } from '@remix-run/react'
import { AssistantFormDialog } from '../departments_.$id.details/components/form/assistant-form'
import UploadFormDialog from '../departments_.$id.details/components/form/upload-form'
import { MemberFormDialog } from '../departments_.$id.details/components/form/member-form'
import { FilterForm } from '../departments_.$id.details/components/form/filter-form'

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

export const meta: MetaFunction = () => [{ title: 'Gestion de mon départment' }]

export const loader = loaderFn

export default function Department() {
	const loaderData = useLoaderData<typeof loaderFn>()

	const {
		data,
		view,
		membersOption,
		openFilterForm,
		openUploadForm,
		openManualForm,
		openAssistantForm,
		setView,
		handleClose,
		handleSearch,
		handleExport,
		setOpenManualForm,
		setOpenFilterForm,
		setOpenUploadForm,
		handleFilterChange,
		setOpenAssistantForm,
		handleShowMoreTableData,
	} = useDepartment(loaderData)

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
					<div className="flex items-center space-x-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									className="hidden sm:flex items-center"
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
						<Button className="hidden sm:flex items-center" variant="primary">
							Marquer la présence
						</Button>
					</div>
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
					excludeOptions={['STAT']}
					setView={setView}
					onSearch={view !== 'STAT' ? handleSearch : undefined}
					onFilter={view !== 'STAT' ? () => setOpenFilterForm(true) : undefined}
					onExport={view !== 'STAT' ? handleExport : undefined}
				/>
			</div>

			{(view === Views.CULTE || view === Views.SERVICE) && (
				<Card className="space-y-2 pb-4 mb-2">
					<TableContent
						data={data.members}
						departmentId={data.department.id}
						total={data.total}
						onShowMore={handleShowMoreTableData}
					/>
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
