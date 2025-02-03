import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { type MetaFunction } from '@remix-run/node'
import { TableToolbar } from '~/components/toolbar'
import { DropdownMenuComponent } from '~/shared/tribe/dropdown-menu'
import { loaderFn } from './loader.server'
import { useLoaderData } from '@remix-run/react'
import { useHonorFamily } from './hooks/use-honor-family'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'
import { MembersTable } from './components/table'
import type { MemberWithMonthlyAttendances } from './types'
import { useDownloadFile } from '~/shared/hooks'

export const meta: MetaFunction = () => [{ title: "Famille d'honneur" }]

export const loader = loaderFn

export default function HonorFamily() {
	const loaderData = useLoaderData<typeof loaderFn>()

	const {
		view,
		filterData,
		honorFamily,
		fetcher,
		statView,
		isExporting,
		searchParams,
		membersOption,
		openFilterForm,
		openManualForm,
		openUploadForm,
		openAttendanceForm,
		openAssistantForm,
		setView,
		setStatView,
		handleClose,
		handleSearch,
		setIsExporting,
		setOpenManualForm,
		setOpenUploadForm,
		setOpenFilterForm,
		handleFilterChange,
		setOpenAssistantForm,
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
						view={view}
						excludeOptions={['STAT']}
						setView={setView}
						onSearch={handleSearch}
						onFilter={() => setOpenFilterForm(true)}
						onExport={handleExport}
					/>
				</div>
				<Card className="space-y-2 mb-4">
					<MembersTable
						data={
							honorFamily.members as unknown as MemberWithMonthlyAttendances[]
						}
					/>
					{honorFamily.total > DEFAULT_QUERY_TAKE && (
						<div className="flex justify-center pb-2">
							<Button
								size="sm"
								type="button"
								variant="ghost"
								className="bg-neutral-200 rounded-full"
								onClick={handleShowMoreTableData}
								disabled={filterData.take >= honorFamily.total}
							>
								Voir plus
							</Button>
						</div>
					)}
				</Card>
			</div>
			{/* {openAttendanceForm && (
				<AttendanceFormDialog
					onClose={handleClose}
					entity={AttendanceReportEntity.DEPARTMENT}
					entityIds={{ departmentId: data.department.id }}
					members={data.departmentMembers}
				/>
			)} */}
		</MainContent>
	)
}
