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
									const church = cell.row.original
									return cell.column.id === 'actions' ? (
										<TableCell
											key={cell.id}
											className="flex items-center justify-center gap-2"
										>
											<Button
												variant="primary-ghost"
												size="icon-sm"
												onClick={() => onEdit(church)}
											>
												<RiEditLine size={16} />
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
							<TableCell colSpan={columns.length} className="h-20 text-center">
								Aucun résultat.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	)
}
