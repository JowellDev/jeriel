import { RiExternalLinkLine } from '@remixicon/react'
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
} from '@tanstack/react-table'
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from '~/components/ui/table'
import { type MemberWithMonthlyAttendances } from '../../types'
import { getColumns } from './stat-colums'
import { Button } from '~/components/ui/button'
import { getMonthSundays } from '~/utils/date'
import { sub } from 'date-fns'

interface Props {
	data: MemberWithMonthlyAttendances[]
}
export function StatTable({ data }: Readonly<Props>) {
	const lastMonth = sub(new Date(), { months: 1 })
	const currentMonthSundays = getMonthSundays(new Date())
	const table = useReactTable({
		data,
		columns: getColumns(currentMonthSundays, lastMonth),
		getCoreRowModel: getCoreRowModel(),
	})

	return (
		<Table>
			<TableHeader>
				{table.getHeaderGroups().map(headerGroup => (
					<TableRow key={headerGroup.id}>
						{headerGroup.headers.map(header => (
							<TableHead key={header.id} className="font-semibold">
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
						<TableRow
							key={row.id}
							data-state={row.getIsSelected() && 'selected'}
						>
							{row.getVisibleCells().map(cell => {
								return cell.column.id === 'actions' ? (
									<TableCell key={cell.id}>
										<Button variant="ghost" size="icon-sm">
											<RiExternalLinkLine size={20} />
										</Button>
									</TableCell>
								) : (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								)
							})}
						</TableRow>
					))
				) : (
					<TableRow>
						<TableCell
							colSpan={getColumns(currentMonthSundays, lastMonth).length}
							className="h-24 text-center"
						>
							Aucune donnée.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}
