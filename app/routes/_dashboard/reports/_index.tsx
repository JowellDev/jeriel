import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { ReportTable } from './components/report-table'
import { actionFn } from './action.server'
import { loaderFn } from './loader.server'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine } from '@remixicon/react'
import { Card } from '~/components/ui/card'
import { TableToolbar } from '~/components/toolbar'
import { useReport } from './hooks/use-report'
import { useLoaderData } from '@remix-run/react'
import AttendanceReportDetails from './components/report-details/report-details'

export const loader = loaderFn
export const action = actionFn

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Résoudre les conflits',
		action: 'add-department',
	},
]

export default function Report() {
	const loaderData = useLoaderData<typeof loaderFn>()

	const {
		data,
		handleDisplayMore,
		handleSearch,
		handleSpeedDialItemClick,
		openReportDetails,
		handleSeeDetails,
		handleCloseDetails,
		reportAttendances,
	} = useReport(loaderData)

	return (
		<MainContent headerChildren={<Header title="Rapports"></Header>}>
			<div className="flex flex-col gap-5">
				<TableToolbar
					onSearch={handleSearch}
					searchContainerClassName="sm:w-1/3"
					align="end"
				/>
				<Card className="space-y-2 pb-4 mb-2">
					<ReportTable
						data={data.attendanceReports}
						seeReportDetails={handleSeeDetails}
					/>
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
					onClose={handleCloseDetails}
					reportDetails={reportAttendances}
				/>
			)}

			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
