import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { ReportTable } from './components/report-table'
import { type LoaderType, loaderFn } from './loader.server'
import { Card } from '~/components/ui/card'
import { TableToolbar } from '~/components/toolbar'
import { useMyReports } from './hooks/use-my-reports'
import { type MetaFunction, useLoaderData } from '@remix-run/react'
import AttendanceReportDetails from '../reports/components/report-details/report-details'
import EditAttendanceForm from './components/edit-attendance-form'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { DateRangePicker } from '~/components/form/date-range-picker'
import type { EntityType } from '../reports/model'

export const meta: MetaFunction = () => [{ title: 'Jeriel | Mes rapports' }]

export const loader = loaderFn

function getManagedEntityByType(
	managedEntities: Awaited<ReturnType<LoaderType>>['managedEntities'],
	entityType: EntityType,
) {
	if (!managedEntities || entityType === 'ALL') return null

	const entityMap = {
		TRIBE: managedEntities.tribe,
		DEPARTMENT: managedEntities.department,
		HONOR_FAMILY: managedEntities.honorFamily,
	}

	return entityMap[entityType] ?? null
}

export default function MyReports() {
	const loaderData = useLoaderData<typeof loaderFn>()

	const {
		data,
		from,
		to,
		openEditForm,
		openReportDetails,
		selectedReport,
		handleDisplayMore,
		handleSearch,
		handleSeeDetails,
		handleEditReport,
		handleClose,
		handleOnPeriodChange,
		handlePeriodFilter,
		handleResetDateRange,
	} = useMyReports(loaderData)

	return (
		<MainContent
			headerChildren={
				<Header title="Mes rapports">
					<div className="flex space-x-2">
						<div className="hidden sm:block">
							<DateRangePicker
								defaultLabel="Sélectionner une période"
								onResetDate={handleResetDateRange}
								defaultValue={{
									from: from?.toISOString(),
									to: to?.toISOString(),
								}}
								onValueChange={dateRange => handleOnPeriodChange(dateRange)}
							/>
						</div>
						<Button
							className="hidden sm:block"
							variant="primary"
							disabled={!(from && to)}
							onClick={handlePeriodFilter}
						>
							Filtrer
						</Button>
					</div>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<div className="sm:hidden flex space-x-2">
					<DateRangePicker
						defaultLabel="Sélectionner une période"
						onResetDate={handleResetDateRange}
						defaultValue={{
							from: from?.toISOString(),
							to: to?.toISOString(),
						}}
						onValueChange={dateRange => handleOnPeriodChange(dateRange)}
						className="w-full"
					/>
					<Button
						variant="primary"
						disabled={!(from && to)}
						onClick={handlePeriodFilter}
					>
						Filtrer
					</Button>
				</div>
				<TableToolbar
					onSearch={handleSearch}
					searchContainerClassName="sm:w-1/3"
					align="end"
				/>
				<Card className="space-y-2 pb-4 mb-2">
					<ReportTable
						data={data.reports}
						seeReportDetails={handleSeeDetails}
						onEditReport={handleEditReport}
					/>
					<div className="flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
							disabled={data.reports.length === data.total}
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
					reportDetails={selectedReport}
					entity={selectedReport?.entity}
				/>
			)}

			{openEditForm &&
				selectedReport &&
				(() => {
					const entity = selectedReport.entity
					const managedEntity = getManagedEntityByType(
						data.managedEntities,
						entity,
					)

					if (!managedEntity || entity === 'ALL') return null

					return (
						<EditAttendanceForm
							onClose={handleClose}
							entity={entity}
							entityIds={{
								tribeId: entity === 'TRIBE' ? managedEntity.id : undefined,
								departmentId:
									entity === 'DEPARTMENT' ? managedEntity.id : undefined,
								honorFamilyId:
									entity === 'HONOR_FAMILY' ? managedEntity.id : undefined,
							}}
							members={managedEntity.members}
							services={managedEntity.services}
							reportToEdit={selectedReport}
						/>
					)
				})()}
		</MainContent>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
