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
import { getColumns } from './columns'
import type { BirthdayMember, EntityType } from '../types'
import { Button } from '~/components/ui/button'
import { RiEyeLine } from '@remixicon/react'

interface Props {
	data: BirthdayMember[]
	entityType: EntityType
	canSeeAll: boolean
	onSeeMember: (member: BirthdayMember) => void
}

export function BirthdayTable({
	data,
	entityType,
	canSeeAll,
	onSeeMember,
}: Props) {
	const columns = getColumns(entityType, canSeeAll)
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
									return cell.column.id === 'actions' ? (
										<TableCell
											key={cell.id}
											className="flex items-center justify-center text-xs sm:text-sm"
										>
											<Button
												variant="primary-ghost"
												size="icon-sm"
												onClick={() => onSeeMember(row.original)}
											>
												<RiEyeLine size={20} />
											</Button>
										</TableCell>
									) : (
										<TableCell
											key={cell.id}
											className="min-w-48 sm:min-w-0 text-xs sm:text-sm"
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
