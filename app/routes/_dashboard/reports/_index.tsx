import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { ReportTable } from './components/report-table/report-table'
import { actionFn } from './action.server'
import { loaderFn } from './loader.server'
import { Card } from '~/components/ui/card'
import { TableToolbar } from '~/components/toolbar'
import { useReport } from './hooks/use-report'
import { type MetaFunction, useLoaderData } from '@remix-run/react'
import AttendanceReportDetails from './components/report-details/report-details'
import { VIEWS } from './constants'
import FilterFormDialog from './components/forms/filter-form'
import { ConflictTable } from './components/conflict-table/conflict-table'
import ConflictResolutionForm from './components/conflict-form/form'
import type { AttendanceReport } from './model'

export const meta: MetaFunction = () => [{ title: 'Gestion des rapports' }]

export const loader = loaderFn
export const action = actionFn

export default function Report() {
	const loaderData = useLoaderData<typeof loaderFn>()

	const {
		data,
		view,
		setView,
		handleDisplayMore,
		handleSearch,
		openFilterForm,
		setOpenFilterForm,
		openReportDetails,
		handleSeeDetails,
		handleClose,
		openConflictForm,
		handleResolveConflict,
		attendanceConflict,
		handleOnFilter,
		reportAttendances,
	} = useReport(loaderData)

	return (
		<MainContent headerChildren={<Header title="Rapports"></Header>}>
			<div className="flex flex-col gap-5">
				{view === 'REPORTS' ? (
					<TableToolbar
						views={VIEWS}
						view={view}
						setView={setView}
						onSearch={handleSearch}
						onFilter={() => setOpenFilterForm(true)}
						searchContainerClassName="sm:w-1/3"
						align="end"
					/>
				) : (
					<TableToolbar
						views={VIEWS}
						view={view}
						setView={setView}
						onSearch={handleSearch}
						searchContainerClassName="sm:w-1/3"
						align="end"
					/>
				)}
				<Card className="space-y-2 pb-4 mb-2">
					{view === 'REPORTS' ? (
						<ReportTable
							data={data.attendanceReports as AttendanceReport[]}
							seeReportDetails={handleSeeDetails}
						/>
					) : (
						<ConflictTable
							data={data.membersWithAttendancesConflicts}
							onResolveConflict={handleResolveConflict}
						/>
					)}
					<div className="flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
							disabled={data.attendanceReports.length === data.total}
							onClick={handleDisplayMore}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>

			{openReportDetails && (
				<AttendanceReportDetails
					onClose={handleClose}
					reportDetails={reportAttendances}
					entity={reportAttendances?.entity}
				/>
			)}
			{openConflictForm && (
				<ConflictResolutionForm
					onClose={handleClose}
					member={attendanceConflict}
				/>
			)}

			{openFilterForm && (
				<FilterFormDialog
					onSubmit={handleOnFilter}
					onClose={() => setOpenFilterForm(false)}
					defaultValues={data.filterData}
				/>
			)}
		</MainContent>
	)
}
