import { Link } from '@remix-run/react'
import { RiEditLine, RiExternalLinkLine } from '@remixicon/react'
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table'

import { TooltipButton } from '~/components/ui/tooltip-button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'

import type { HonorFamily } from '../../types'
import { columns } from './columns'

interface Props {
	data: HonorFamily[]
	onEdit: (honorFamily: HonorFamily) => void
}

export function HonorFamiliesTable({ data, onEdit }: Readonly<Props>) {
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
									<TableCell
										key={cell.id}
										className="flex items-center justify-center gap-2 text-xs sm:text-sm"
									>
										<TooltipButton
											variant="primary-ghost"
											size="icon-sm"
											onClick={() => onEdit(honorFamily)}
											tooltip="Modifier la famille d'honneur"
										>
											<RiEditLine size={20} />
										</TooltipButton>
										<Link to={`/honor-families/${row.original.id}/details`}>
											<TooltipButton
												variant="primary-ghost"
												size="icon-sm"
												tooltip="Voir les détails de la famille"
											>
												<RiExternalLinkLine size={20} />
											</TooltipButton>
										</Link>
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
