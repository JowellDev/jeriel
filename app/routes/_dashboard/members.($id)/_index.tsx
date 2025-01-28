import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { InputSearch } from '~/components/form/input-search'
import { type MetaFunction, useLoaderData } from '@remix-run/react'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import {
	RiAddLine,
	RiArrowDownSLine,
	RiFileExcel2Line,
	RiFilterLine,
	RiUpload2Fill,
} from '@remixicon/react'
import { Card } from '~/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { loaderFn } from './loader.server'
import { actionFn } from './action.server'
import MemberTable from './components/member-table'
import MemberFormDialog from './components/member-form-dialog'
import MemberUploadFormDialog from './components/member-upload-form-dialog'
import FilterFormDialog from './components/filter-form'
import { TableToolbar } from '~/components/toolbar'
import { speedDialItemsActions } from './constants'
import { useMembers } from './hooks/use-members'
import MonthPicker from '~/components/form/month-picker'

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Ajouter un fidèle',
		action: speedDialItemsActions.ADD_MEMBER,
	},
	{
		Icon: RiUpload2Fill,
		label: 'Importer un fichier',
		action: speedDialItemsActions.UPLOAD_FILE,
	},
]

export const meta: MetaFunction = () => [{ title: 'Gestion des fidèles' }]

export const loader = loaderFn

export const action = actionFn

export default function Member() {
	const loaderData = useLoaderData<typeof loaderFn>()
	const {
		data,
		fetcher,
		currentMonth,
		openFilterForm,
		openManualForm,
		openUploadForm,
		handleClose,
		handleSearch,
		handleOnFilter,
		handleOnExport,
		handleDisplayMore,
		setOpenFilterForm,
		setOpenManualForm,
		setOpenUploadForm,
		handleOnPeriodChange,
		handleSpeedDialItemClick,
	} = useMembers(loaderData)

	return (
		<MainContent
			headerChildren={
				<Header title="Fidèles">
					<div className="hidden sm:flex sm:space-x-2 sm:items-center">
						<MonthPicker onChange={handleOnPeriodChange} />
						<fetcher.Form className="flex items-center gap-3">
							<InputSearch
								onSearch={handleSearch}
								placeholder="Nom / téléphone"
								defaultValue={data.filterData.query}
							/>
						</fetcher.Form>
						<Button
							variant="outline"
							className="flex items-center space-x-1 border-input"
							onClick={() => setOpenFilterForm(true)}
						>
							<span>Filtrer</span>
							<RiFilterLine size={20} />
						</Button>
						<Button
							variant="outline"
							className="flex items-center space-x-1 border-input"
						>
							<span>Exporter</span>
							<RiFileExcel2Line size={20} />
						</Button>
					</div>
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
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<div className="sm:hidden">
					<TableToolbar
						onSearch={handleSearch}
						onFilter={() => setOpenFilterForm(true)}
						onExport={handleOnExport}
					/>
				</div>
				<Card className="space-y-2 pb-4 mb-2">
					<MemberTable
						currentMonth={currentMonth}
						data={data.members as unknown as MemberMonthlyAttendances[]}
					/>
					<div className="flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							disabled={data.members.length === data.total}
							className="bg-neutral-200 rounded-full"
							onClick={handleDisplayMore}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>
			{openManualForm && <MemberFormDialog onClose={handleClose} />}
			{openUploadForm && <MemberUploadFormDialog onClose={handleClose} />}
			{openFilterForm && (
				<FilterFormDialog
					onSubmit={handleOnFilter}
					onClose={handleClose}
					defaultValues={data.filterData}
				/>
			)}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
