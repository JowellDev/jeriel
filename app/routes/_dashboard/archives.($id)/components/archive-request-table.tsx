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
import { RiCloseCircleLine, RiEditLine } from '@remixicon/react'
import { TooltipButton } from '~/components/ui/tooltip-button'
import type { ArchiveRequest } from '../model'
import { ArchiveRequestStatus } from '~/shared/enum'

interface Props {
	data: ArchiveRequest[]
	onEdit: (archiveRequest: ArchiveRequest) => void
	onReject: (archiveRequest: ArchiveRequest) => void
}

export function ArchiveRequestTable({
	data,
	onEdit,
	onReject,
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
								return cell.column.id === 'actions' ? (
									<TableCell
										key={cell.id}
										className="flex items-center justify-center gap-2 text-xs sm:text-sm"
									>
										{request.status === ArchiveRequestStatus.REJECTED ||
										request.usersToArchive.every(
											user => user.deletedAt,
										) ? null : (
											<>
												<TooltipButton
													variant="primary-ghost"
													size="icon-sm"
													tooltip="Traiter la demande"
													onClick={() => onEdit(request)}
												>
													<RiEditLine size={20} />
												</TooltipButton>
												<TooltipButton
													variant="destructive-ghost"
													size="icon-sm"
													tooltip="Rejeter la demande"
													onClick={() => onReject(request)}
												>
													<RiCloseCircleLine size={20} />
												</TooltipButton>
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
