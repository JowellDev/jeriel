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
} from '@/components/ui/table'
import { columns } from './columns'
import { RiEditLine, RiExternalLinkLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import type { Department } from '../model'

interface Props {
	data: Department[]
	onEdit: (department: Department) => void
}

export function DepartmentTable({ data, onEdit }: Props) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})

	return (
		<div className="rounded-md">
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map(headerGroup => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map(header => (
								<TableHead key={header.id}>
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
											className="flex items-center justify-center gap-2"
										>
											<Button
												variant="primary-ghost"
												size="icon-sm"
												onClick={() => onEdit(Department)}
											>
												<RiEditLine size={16} />
											</Button>
											<Button variant="primary-ghost" size="icon-sm">
												<RiExternalLinkLine size={16} />
											</Button>
										</TableCell>
									) : (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									)
								})}
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className="h-24 text-center">
								Aucun résultat.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	)
}
