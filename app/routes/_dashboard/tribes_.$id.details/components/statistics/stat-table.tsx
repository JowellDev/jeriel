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
import { getStatCultColumns } from './stat-cult-colums'
import { Button } from '~/components/ui/button'
import { getMonthSundays } from '~/utils/date'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { Link } from '@remix-run/react'

interface Props {
	data: MemberMonthlyAttendances[]
	tribeId: string
}
export function StatTable({ data, tribeId }: Readonly<Props>) {
	const currentMonthSundays = getMonthSundays(new Date())
	const table = useReactTable({
		data,
		columns: getStatCultColumns(currentMonthSundays),
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
										<Link
											to={`/members/${row.original.id}/details?from=tribe&id=${tribeId}`}
										>
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
							colSpan={getStatCultColumns(currentMonthSundays).length}
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
