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
	onResetPassword: (userId: string, userName: string) => void
}

export default function AdminTable({
	data,
	currentUserId,
	churchAdminId,
	onRemoveAdmin,
	onResetPassword,
}: Readonly<Props>) {
	const columns = getColumns({
		currentUserId,
		churchAdminId,
		onRemoveAdmin,
		onResetPassword,
	})

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
								className="font-semibold text-xs sm:text-sm min-w-36 sm:min-w-0"
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
									<TableCell key={cell.id} className="text-xs sm:text-sm">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								) : (
									<TableCell
										key={cell.id}
										className="min-w-52 sm:min-w-0 text-xs sm:text-sm"
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
