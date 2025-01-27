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
import { getColumns, type MemberAttendanceData } from './columns'
import { RiEditLine } from '@remixicon/react'
import { Button } from '~/components/ui/button'

interface Props {
	data: MemberAttendanceData[]
}

export function MemberAttendanceMarkingTable({ data }: Readonly<Props>) {
	const columns = getColumns(new Date())

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		enableRowSelection: true,
	})

	function handleOnClick(scope: string, value: any) {
		console.log('scope =====>', scope)
		console.log('value =====>', value)
	}

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
								const attendance = cell.row.original

								return ['serviceAttendance', 'churchAttendance'].includes(
									cell.column.id,
								) ? (
									<TableCell key={cell.id} className="text-center">
										<Button
											variant="primary-ghost"
											size="icon-sm"
											onClick={() => handleOnClick(cell.column.id, attendance)}
										>
											<RiEditLine size={20} />
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
							Aucun membre.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}
