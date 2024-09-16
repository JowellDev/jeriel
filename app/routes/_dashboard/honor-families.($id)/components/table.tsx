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
import { RiEditLine, RiExternalLinkLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'
import type { HonorFamily } from '../types'
import { columns } from './columns'

interface Props {
	data: HonorFamily[]
	onEdit: (honorFamily: HonorFamily) => void
}

export function HonorFamilyTable({ data, onEdit }: Props) {
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
								const honorFamily = cell.row.original
								return cell.column.id === 'actions' ? (
									<TableCell key={cell.id}>
										<Button
											variant="primary-ghost"
											size="icon-sm"
											onClick={() => onEdit(honorFamily)}
										>
											<RiEditLine size={16} />
										</Button>
										<Button variant="ghost" size="icon-sm">
											<RiExternalLinkLine size={20} />
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
						<TableCell colSpan={columns.length} className="h-24 text-center">
							Aucune données.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}
