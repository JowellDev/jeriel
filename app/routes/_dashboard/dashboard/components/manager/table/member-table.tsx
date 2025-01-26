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
	) => ColumnDef<MemberMonthlyAttendances>[]
	currentMonthSundays: Date[]
}
export function MemberTable({
	data,
	getColumns,
	currentMonthSundays,
}: Readonly<Props>) {
	const columns = useMemo(
		() => getColumns(currentMonthSundays),
		[getColumns, currentMonthSundays],
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
							<TableHead
								key={header.id}
								className="font-semibold text-xs sm:text-sm"
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
						<TableRow
							key={row.id}
							data-state={row.getIsSelected() && 'selected'}
						>
							{row.getVisibleCells().map(cell => {
								return cell.column.id === 'actions' ? (
									<TableCell
										key={cell.id}
										className="text-xs sm:text-sm flex items-center justify-center"
									>
										<Link to={`/members/${row.original.id}/details`}>
											<Button variant="primary-ghost" size="icon-sm">
												<RiExternalLinkLine size={20} />
											</Button>
										</Link>
									</TableCell>
								) : (
									<TableCell
										key={cell.id}
										className="min-w-48 sm:min-w-0 text-xs sm:text-sm"
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
							colSpan={getColumns(currentMonthSundays).length}
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
