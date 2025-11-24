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
import { RiDeleteBinLine, RiEditLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'
import { columns } from './columns'
import type { ServiceData } from '../../../types'

interface Props {
	data: ServiceData[]
	onEdit: (data: ServiceData) => void
	onDelete: (data: ServiceData) => void
}

export default function AdminServiceTable({
	data,
	onEdit,
	onDelete,
}: Readonly<Props>) {
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
								className="font-semibold text-xs sm:text-sm min-w-28 sm:min-w-0"
							>
								{flexRender(
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
										className="text-xs sm:text-sm flex justify-center items-center space-x-1"
									>
										<Button
											variant="primary-ghost"
											size="icon-sm"
											onClick={() => onEdit(row.original)}
										>
											<RiEditLine size={20} />
										</Button>
										<Button
											variant="destructive-ghost"
											size="icon-sm"
											onClick={() => onDelete(row.original)}
										>
											<RiDeleteBinLine size={20} />
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
