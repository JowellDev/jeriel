import { RiExternalLinkLine } from '@remixicon/react'
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	type ColumnDef,
} from '@tanstack/react-table'
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from '~/components/ui/table'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { Button } from '~/components/ui/button'
import { Link } from '@remix-run/react'
import { useMemo } from 'react'

interface Props {
	data: MemberMonthlyAttendances[]
	getColumns: (
		currentMonthSundays: Date[],
		lastMonth?: Date,
	) => ColumnDef<MemberMonthlyAttendances>[]
	currentMonthSundays: Date[]
	lastMonth?: Date
}
export function TribeMemberTable({
	data,
	getColumns,
	currentMonthSundays,
	lastMonth,
}: Readonly<Props>) {
	const columns = useMemo(
		() => getColumns(currentMonthSundays, lastMonth),
		[getColumns, currentMonthSundays, lastMonth],
	)

	const table = useReactTable({
		data,
		columns,
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
										<Link to={`/members/${row.original.id}/details`}>
											<Button variant="ghost" size="icon-sm">
												<RiExternalLinkLine size={20} />
											</Button>
										</Link>
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
