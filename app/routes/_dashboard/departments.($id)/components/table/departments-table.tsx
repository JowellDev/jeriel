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
import { columns } from './columns'
import { RiEditLine, RiExternalLinkLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'
import type { Department } from '../../model'
import { useNavigate } from '@remix-run/react'

interface Props {
	data: Department[]
	onEdit: (department: Department) => void
}

export function DepartmentsTable({ data, onEdit }: Props) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})

	const navigate = useNavigate()

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
								const Department = cell.row.original
								return cell.column.id === 'actions' ? (
									<TableCell
										key={cell.id}
										className="flex items-center justify-center gap-2 text-xs sm:text-sm"
									>
										<Button
											variant="primary-ghost"
											size="icon-sm"
											onClick={() => onEdit(Department)}
										>
											<RiEditLine size={20} />
										</Button>
										<Button
											variant="primary-ghost"
											size="icon-sm"
											onClick={() =>
												navigate(`/departments/${row.original.id}/details`)
											}
										>
											<RiExternalLinkLine size={20} />
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
