import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { type MetaFunction } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { TableToolbar } from '~/components/toolbar'
import { loaderFn } from './loader.server'
import { useTribeMembers } from './hooks/use-tribe-members'
import { FilterForm } from '~/shared/forms/filter-form'
import { DropdownMenuComponent } from '~/shared/forms/dropdown-menu'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import { speedDialItems } from './constants'
import { MemberFormDialog } from '~/shared/forms/member-form'
import { actionFn } from './action.server'
import { UploadFormDialog } from '~/shared/forms/upload-form'
import { AttendanceReportEntity } from '@prisma/client'
import AttendanceFormDialog from '../../../shared/attendance-form/form/attendance-form'
import { renderTable } from '~/shared/member-table/table.utlis'

export const meta: MetaFunction = () => [{ title: 'Gestion de ma tribu' }]

export const loader = loaderFn
export const action = actionFn

export default function Tribe() {
	const loaderData = useLoaderData<typeof loaderFn>()
	const fetcher = useFetcher<typeof actionFn>()

	const {
		data,
		currentMonth,
		view,
		openFilterForm,
		openCreateForm,
		openUploadForm,
		openAttendanceForm,
		setView,
		handleSearch,
		handleOnExport,
		handleDisplayMore,
		setOpenFilterForm,
		handleOnFilter,
		setOpenCreateForm,
		setOpenUploadForm,
		setOpenAttendanceForm,
		handleSpeedDialItemClick,
		handleClose,
	} = useTribeMembers(loaderData)

	return (
		<MainContent
			headerChildren={
				<Header title="Tribu">
					<div className="hidden sm:flex sm:space-x-2 sm:items-center">
						<DropdownMenuComponent
							onOpenManuallyForm={() => setOpenCreateForm(true)}
							onOpenUploadForm={() => setOpenUploadForm(true)}
							variant={'outline'}
							classname="border-input"
						/>
						<Button
							className="hidden sm:block"
							variant={'primary'}
							onClick={() => setOpenAttendanceForm(true)}
						>
							Marquer la présence
						</Button>
					</div>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<div className="space-y-2 mb-4">
					<TableToolbar
						view={view}
						excludeOptions={['STAT']}
						setView={setView}
						onSearch={handleSearch}
						onFilter={() => setOpenFilterForm(true)}
						onExport={handleOnExport}
					/>
				</div>
				<Card className="space-y-2 pb-4 mb-2">
					{renderTable({
						view: view,
						data: data?.members,
						currentMonth: currentMonth,
					})}
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

			{openCreateForm && (
				<MemberFormDialog
					tribeId={data.tribeId}
					fetcher={fetcher}
					onClose={handleClose}
					formAction="/tribe"
				/>
			)}

			{openUploadForm && (
				<UploadFormDialog fetcher={fetcher} onClose={handleClose} />
			)}

			{openAttendanceForm && (
				<AttendanceFormDialog
					onClose={handleClose}
					entity={AttendanceReportEntity.TRIBE}
					entityIds={{ tribeId: data.tribeId }}
					members={data.allMembers}
					services={data.services}
				/>
			)}

			{openFilterForm && (
				<FilterForm
					filterData={data.filterData}
					onClose={() => setOpenFilterForm(false)}
					onFilter={handleOnFilter}
				/>
			)}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
