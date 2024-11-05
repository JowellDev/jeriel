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
import { RiExternalLinkLine, RiEditLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'
import { columns } from './columns'
import { type Tribe } from '../types'
import { useNavigate } from '@remix-run/react'

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
	const navigate = useNavigate()

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
								return cell.column.id === 'actions' ? (
									<TableCell
										key={`${row.id}_${cell.id}`}
										className="text-xs sm:text-sm flex items-center justify-center gap-2"
									>
										<Button
											variant="primary-ghost"
											size="icon-sm"
											onClick={() => onEdit(cell.row.original)}
										>
											<RiEditLine size={20} />
										</Button>

										<Button
											variant="primary-ghost"
											size="icon-sm"
											onClick={() =>
												navigate(`/tribes/${row.original.id}/details`)
											}
										>
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
						<TableCell colSpan={columns.length} className="h-20 text-center">
							Aucune donnée.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}
