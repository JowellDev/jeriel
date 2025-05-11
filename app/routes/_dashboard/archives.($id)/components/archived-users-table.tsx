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
import { archivedUsersColumns, archiveRequestColumns } from './columns'
import { RiInboxUnarchiveLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'
import type { User } from '../model'

interface Props {
	data: User[]
	onUnarchive: (user: User) => void
}

export function ArchivedUsersTable({ data, onUnarchive }: Readonly<Props>) {
	const table = useReactTable({
		data,
		columns: archivedUsersColumns,
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
								const user = cell.row.original
								return cell.column.id === 'actions' ? (
									<TableCell
										key={cell.id}
										className="flex items-center justify-center gap-2 text-xs sm:text-sm"
									>
										<Button
											variant="primary-ghost"
											size="icon-sm"
											onClick={() => onUnarchive(user)}
										>
											<RiInboxUnarchiveLine size={20} />
										</Button>
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
