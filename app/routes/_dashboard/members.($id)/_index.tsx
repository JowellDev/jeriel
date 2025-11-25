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
import MemberTable from './components/tables/member-table'
import { EditMemberForm } from './components/forms/edit-member-form'
import { UploadMemberForm } from './components/forms/upload-member-form'
import { FilterForm } from './components/forms/filter-form'
import { TableToolbar } from '~/components/toolbar'
import { speedDialItemsActions } from './constants'
import { useMembers } from './hooks/use-members'
import MonthPicker from '~/components/form/month-picker'
import { GeneralErrorBoundary } from '~/components/error-boundary'

import { loaderFn } from './server/loaders/loader.server'
import { actionFn } from './server/actions/action.server'

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

export const meta: MetaFunction = () => [
	{ title: 'Jeriel | Gestion des fidèles' },
]

export const loader = loaderFn

export const action = actionFn

export default function Member() {
	const loaderData = useLoaderData<typeof loaderFn>()

	const {
		data,
		currentMonth,
		openFilterForm,
		openManualForm,
		openUploadForm,
		isExporting,
		handleClose,
		handleSearch,
		handleOnFilter,
		handleExport,
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
						<div className="flex items-center gap-3">
							<InputSearch
								onSearch={handleSearch}
								placeholder="Nom, email, téléphone"
								defaultValue={data.filterData.query}
							/>
						</div>
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
							onClick={() => handleExport()}
							disabled={isExporting || loaderData.total <= 0}
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
						onExport={handleExport}
						isExporting={isExporting}
						canExport={loaderData.total > 0}
					/>
				</div>
				<Card className="space-y-2 mb-2">
					<MemberTable
						currentMonth={currentMonth}
						data={data.members as unknown as MemberMonthlyAttendances[]}
					/>

					<div className="flex justify-center pb-2">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							disabled={data.filterData.take >= data.total}
							className="bg-neutral-200 rounded-full"
							onClick={handleDisplayMore}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>
			{openManualForm && <EditMemberForm onClose={handleClose} />}
			{openUploadForm && <UploadMemberForm onClose={handleClose} />}
			{openFilterForm && (
				<FilterForm
					defaultValues={data.filterData}
					onSubmit={handleOnFilter}
					onClose={handleClose}
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
