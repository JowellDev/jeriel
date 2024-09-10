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
import { RiExternalLinkLine, RiEditLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import { columns } from './columns'
import { type Tribe } from '../types'

interface Props {
	data: Tribe[]
	onEdit: (data: Tribe) => void
}

export function TribeTable({ data, onEdit }: Readonly<Props>) {
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
								return cell.column.id === 'actions' ? (
									<TableCell key={`${row.id}_${cell.id}`}>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => onEdit(cell.row.original)}
										>
											<RiEditLine size={20} />
										</Button>

										<Button variant="ghost" size="icon-sm">
											<RiExternalLinkLine size={20} />
										</Button>
									</TableCell>
								) : (
									<TableCell key={`${row.id}_${cell.id}`}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								)
							})}
						</TableRow>
					))
				) : (
					<TableRow>
						<TableCell colSpan={columns.length} className="h-24 text-center">
							Aucune donnée.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}
