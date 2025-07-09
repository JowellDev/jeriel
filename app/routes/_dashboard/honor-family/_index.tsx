import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { type MetaFunction } from '@remix-run/node'
import { TableToolbar } from '~/components/toolbar'
import { DropdownMenuComponent } from '~/shared/forms/dropdown-menu'
import { loaderFn } from './loader.server'
import { useLoaderData } from '@remix-run/react'
import { useHonorFamily } from './hooks/use-honor-family'
import { useDownloadFile } from '~/shared/hooks'
import { FilterFormDialog } from './components/filter-form'
import AttendanceFormDialog from '../../../shared/attendance-form/form/attendance-form'
import { AttendanceReportEntity } from '@prisma/client'
import { MemberFormDialog } from './components/member-form'
import { UploadFormDialog } from './components/upload-form'
import { actionFn } from './action.server'
import { renderTable } from '~/shared/member-table/table.utlis'

export const meta: MetaFunction = () => [
	{ title: "Gestion de ma famille d'honneur" },
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
	const loaderData = useLoaderData<typeof loaderFn>()

	const {
		view,
		filterData,
		honorFamily,
		currentMonth,
		fetcher,
		isExporting,
		openFilterForm,
		// statView,
		// searchParams,
		// membersOption,
		openManualForm,
		openUploadForm,
		openAttendanceForm,
		// openAssistantForm,
		// setStatView,
		// setOpenAssistantForm,
		setView,
		handleClose,
		handleSearch,
		setIsExporting,
		setOpenManualForm,
		setOpenUploadForm,
		setOpenFilterForm,
		handleFilterChange,
		setOpenAttendanceForm,
		handleExport,
		handleShowMoreTableData,
	} = useHonorFamily(loaderData)

	useDownloadFile(fetcher, { isExporting, setIsExporting })

	return (
		<MainContent
			headerChildren={
				<Header title="Famille d'honneur">
					<DropdownMenuComponent
						onOpenManuallyForm={() => setOpenManualForm(true)}
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
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<div className="space-y-2">
					<TableToolbar
						views={VIEWS}
						view={view}
						excludeOptions={['STAT']}
						setView={setView}
						onSearch={handleSearch}
						onFilter={() => setOpenFilterForm(true)}
						onExport={handleExport}
						canExport={honorFamily?.members.length > 0}
					/>
				</div>
				<Card className="space-y-2 pb-4 mb-2">
					{renderTable({
						view: view,
						data: honorFamily?.members,
						currentMonth: currentMonth,
					})}
					<div className="flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							disabled={honorFamily?.members.length === honorFamily?.total}
							className="bg-neutral-200 rounded-full"
							onClick={handleShowMoreTableData}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>
			{openAttendanceForm && (
				<AttendanceFormDialog
					onClose={handleClose}
					entity={AttendanceReportEntity.HONOR_FAMILY}
					entityIds={{ honorFamilyId: honorFamily.id }}
					members={honorFamily.allMembers}
				/>
			)}

			{openFilterForm && (
				<FilterFormDialog
					filterData={filterData}
					onClose={handleClose}
					onFilter={handleFilterChange}
				/>
			)}

			{openManualForm && <MemberFormDialog onClose={handleClose} />}

			{openUploadForm && <UploadFormDialog onClose={handleClose} />}
		</MainContent>
	)
}
