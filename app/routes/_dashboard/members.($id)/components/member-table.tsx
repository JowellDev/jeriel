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
import { RiExternalLinkLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'
import { getColumns } from './columns'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { getMonthSundays } from '~/utils/date'
import { sub } from 'date-fns'
import { Link } from '@remix-run/react'

interface Props {
	data: MemberMonthlyAttendances[]
}

export function MemberTable({ data }: Readonly<Props>) {
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
									<TableCell key={cell.id} className=" text-xs sm:text-sm">
										<Link to={`/members/${row.original.id}/details`}>
											<Button variant="ghost" size="icon-sm">
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
							colSpan={getColumns(currentMonthSundays, lastMonth).length}
							className="h-24 text-center text-xs sm:text-sm"
						>
							Aucune données.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}
