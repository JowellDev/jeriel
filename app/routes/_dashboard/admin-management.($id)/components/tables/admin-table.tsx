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
import type { AdminUser } from '../../types'

import { getColumns } from './columns'

interface Props {
	data: AdminUser[]
	currentUserId: string
	churchAdminId?: string
	onRemoveAdmin: (userId: string, userName: string) => void
}

export default function AdminTable({
	data,
	currentUserId,
	churchAdminId,
	onRemoveAdmin,
}: Readonly<Props>) {
	const columns = getColumns({ currentUserId, churchAdminId, onRemoveAdmin })

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
							{row.getVisibleCells().map(cell => (
								<TableCell key={cell.id} className="text-xs sm:text-sm">
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</TableCell>
							))}
						</TableRow>
					))
				) : (
					<TableRow>
						<TableCell
							colSpan={columns.length}
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
