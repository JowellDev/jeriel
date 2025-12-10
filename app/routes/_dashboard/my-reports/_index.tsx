import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { ReportTable } from './components/report-table'
import { loaderFn } from './loader.server'
import { Card } from '~/components/ui/card'
import { TableToolbar } from '~/components/toolbar'
import { useMyReports } from './hooks/use-my-reports'
import { type MetaFunction, useLoaderData } from '@remix-run/react'
import AttendanceReportDetails from '../reports/components/report-details/report-details'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export const meta: MetaFunction = () => [{ title: 'Jeriel | Mes rapports' }]

export const loader = loaderFn

export default function MyReports() {
	const loaderData = useLoaderData<typeof loaderFn>()

	const {
		data,
		handleDisplayMore,
		handleSearch,
		openReportDetails,
		handleSeeDetails,
		handleClose,
		reportAttendances,
	} = useMyReports(loaderData)

	return (
		<MainContent headerChildren={<Header title="Mes rapports"></Header>}>
			<div className="flex flex-col gap-5">
				<TableToolbar
					onSearch={handleSearch}
					searchContainerClassName="sm:w-1/3"
					align="end"
				/>
				<Card className="space-y-2 pb-4 mb-2">
					<ReportTable
						data={data.reports}
						seeReportDetails={handleSeeDetails}
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
					reportDetails={reportAttendances}
					entity={reportAttendances?.entity}
				/>
			)}
		</MainContent>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
