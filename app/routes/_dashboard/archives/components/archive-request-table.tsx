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
import { archiveRequestColumns } from './archive-request-columns'
import { RiExternalLinkLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'
import type { ArchiveRequest } from '../model'

interface Props {
	data: ArchiveRequest[]
	onEdit: (archiveRequest: ArchiveRequest) => void
}

export function ArchiveRequestTable({ data, onEdit }: Props) {
	const table = useReactTable({
		data,
		columns: archiveRequestColumns,
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
								const request = cell.row.original
								return cell.column.id === 'actions' ? (
									<TableCell
										key={cell.id}
										className="flex items-center justify-center gap-2"
									>
										<Button
											variant="primary-ghost"
											size="icon-sm"
											onClick={() => onEdit(request)}
										>
											<RiExternalLinkLine size={16} />
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
							colSpan={archiveRequestColumns.length}
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
