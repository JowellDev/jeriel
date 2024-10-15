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
import { RiExternalLinkLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'
import type { ReportData } from '../model'
import { Link } from '@remix-run/react'

interface Props {
	data: ReportData[]
}

export function ReportTable({ data }: Readonly<Props>) {
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
									<TableCell
										key={cell.id}
										className="flex items-center justify-center gap-2"
									>
										<Link
											to={`/${row.original.entityType}/${row.original.id}/details`}
										>
											<Button variant="primary-ghost" size="icon-sm">
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
							colSpan={reportColumns.length}
							className="h-20 text-center"
						>
							Aucun résultat.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}
