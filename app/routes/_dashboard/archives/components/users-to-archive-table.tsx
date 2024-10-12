import {
	flexRender,
	getCoreRowModel,
	type RowSelectionState,
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
import type { UserToArchive } from '../model'
import { usersToArchiveColumns } from './users-to-archive-columns'

interface Props {
	data: UserToArchive[]
	rowSelection: RowSelectionState
	setRowSelection: React.Dispatch<React.SetStateAction<{}>>
}

export function UsersToArchiveTable({
	data,
	rowSelection,
	setRowSelection,
}: Props) {
	const table = useReactTable({
		data,
		columns: usersToArchiveColumns,
		state: { rowSelection },
		getCoreRowModel: getCoreRowModel(),
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
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
								return (
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
