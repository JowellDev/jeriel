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
import { archiveRequestColumns } from './columns'
import type { ArchiveRequest } from '../model'
import { RiDeleteBinLine, RiEditLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'

interface Props {
	data: ArchiveRequest[]
	onEdit: (archiveRequest: ArchiveRequest) => void
	onDelete: (archiveRequest: ArchiveRequest) => void
}

export function ArchiveRequestTable({
	data,
	onEdit,
	onDelete,
}: Readonly<Props>) {
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
							<TableHead
								key={header.id}
								className="font-semibold text-xs sm:text-sm min-w-28 sm:min-w-0"
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
								const request = cell.row.original
								const isPending = request.usersToArchive.some(
									user => !user.deletedAt,
								)

								return cell.column.id === 'actions' ? (
									<TableCell
										key={cell.id}
										className="flex items-center gap-2 text-xs sm:text-sm"
									>
										{isPending && (
											<>
												<Button
													variant="primary-ghost"
													size="icon-sm"
													onClick={() => onEdit(request)}
												>
													<RiEditLine size={20} />
												</Button>
												<Button
													variant="ghost"
													size="icon-sm"
													className="text-red-500 hover:text-red-600 hover:bg-red-50"
													onClick={() => onDelete(request)}
												>
													<RiDeleteBinLine size={20} />
												</Button>
											</>
										)}
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
							colSpan={archiveRequestColumns.length}
							className="h-20 text-center text-xs sm:test-sm"
						>
							Aucune donnée.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}
