import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table'

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'
import { reportColumns } from './report-columns'
import { RiEyeLine, RiEditLine } from '@remixicon/react'
import { TooltipButton } from '~/components/ui/tooltip-button'
import type { AttendanceReport } from '~/routes/_dashboard/reports/model'

interface Props {
	data: AttendanceReport[]
	seeReportDetails: (attendance: AttendanceReport) => void
	onEditReport: (attendance: AttendanceReport) => void
}

export function ReportTable({
	data,
	seeReportDetails,
	onEditReport,
}: Readonly<Props>) {
	const table = useReactTable({
		data,
		columns: reportColumns,
		getCoreRowModel: getCoreRowModel(),
	})

	return (
		<Table>
			<TableHeader>
				{table.getHeaderGroups().map(headerGroup => (
					<TableRow key={headerGroup.id}>
						{headerGroup.headers.map(header => (
							<TableHead
								key={header.id}
								className="font-semibold text-xs sm:text-sm min-w-36 sm:min-w-0"
							>
								{header.isPlaceholder
									? null
									: flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
							</TableHead>
						))}
					</TableRow>
				))}
			</TableHeader>
			<TableBody>
				{table.getRowModel().rows?.length ? (
					table.getRowModel().rows.map(row => (
						<TableRow key={row.id}>
							{row.getVisibleCells().map(cell => {
								const attendance = cell.row.original
								return cell.column.id === 'actions' ? (
									<TableCell
										key={cell.id}
										className="flex items-center justify-center gap-2 text-xs sm:text-sm"
									>
										<TooltipButton
											variant="primary-ghost"
											size="icon-sm"
											onClick={() => onEditReport(attendance)}
											tooltip="Modifier le rapport"
										>
											<RiEditLine size={20} />
										</TooltipButton>
										<TooltipButton
											variant="primary-ghost"
											size="icon-sm"
											onClick={() => seeReportDetails(attendance)}
											tooltip="Voir le rapport"
										>
											<RiEyeLine size={20} />
										</TooltipButton>
									</TableCell>
								) : (
									<TableCell
										key={cell.id}
										className="min-w-40 sm:min-w-0 text-xs sm:text-sm"
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								)
							})}
						</TableRow>
					))
				) : (
					<TableRow>
						<TableCell
							colSpan={reportColumns.length}
							className="h-20 text-center text-xs sm:text-sm"
						>
							Aucune donnée.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}
