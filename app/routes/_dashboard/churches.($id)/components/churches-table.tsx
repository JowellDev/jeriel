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
import { RiEditLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'
import type { Church } from '../model'
import { Switch } from '../../../../components/ui/switch'
import { useFetcher } from '@remix-run/react'

interface Props {
	data: Church[]
	onEdit: (church: Church) => void
}

export function ChurchTable({ data, onEdit }: Props) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})

	const fetcher = useFetcher()

	return (
		<div className="rounded-md">
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map(headerGroup => (
						<TableRow
							key={headerGroup.id}
							className="font-semibold text-xs sm:text-sm"
						>
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
									const church = cell.row.original
									return cell.column.id === 'actions' ? (
										<TableCell
											key={cell.id}
											className="text-xs sm:text-sm flex justify-center items-center space-x-1"
										>
											<Button
												variant="primary-ghost"
												size="icon-sm"
												onClick={() => onEdit(church)}
											>
												<RiEditLine size={20} />
											</Button>
											<fetcher.Form>
												<Switch
													title={church.isActive ? 'active' : 'inactive'}
													checked={church.isActive}
													className="data-[state=checked]:bg-green-500"
													onCheckedChange={value => {
														fetcher.submit(
															{
																intent: 'activate',
																checked: value,
															},
															{ method: 'post', action: `./${church.id}` },
														)
													}}
												/>
											</fetcher.Form>
										</TableCell>
									) : (
										<TableCell
											key={cell.id}
											className="min-w-40 sm:min-w-0 text-xs sm:text-sm"
										>
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
		</div>
	)
}
