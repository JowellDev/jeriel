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
import { getColumns, type ConflictResolutionData } from './columns'
import { Switch } from '~/components/ui/switch'

interface Props {
	data?: ConflictResolutionData[]
	onUpdateAttendance: (payload: {
		attendanceId: string
		field: 'tribePresence' | 'departmentPresence'
		value: boolean
	}) => void
}

export function ConflictResolutionTable({
	data,
	onUpdateAttendance,
}: Readonly<Props>) {
	const columns = getColumns()

	const table = useReactTable({
		data: data ?? [],
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
						<TableRow key={row.id}>
							{row.getVisibleCells().map(cell => {
								const data = cell.row.original

								return ['tribePresence', 'departmentPresence'].includes(
									cell.column.id,
								) ? (
									<TableCell
										key={cell.id}
										className="min-w-48 sm:min-w-0 text-xs sm:text-sm text-center"
									>
										<Switch
											defaultChecked={
												data[
													cell.column.id as
														| 'tribePresence'
														| 'departmentPresence'
												]
											}
											onCheckedChange={value =>
												onUpdateAttendance({
													attendanceId: data.attendanceId,
													field: cell.column.id as
														| 'tribePresence'
														| 'departmentPresence',
													value,
												})
											}
											className="data-[state=checked]:bg-green-500"
										/>
									</TableCell>
								) : (
									<TableCell
										key={cell.id}
										className="min-w-48 sm:min-w-0 text-xs sm:text-sm"
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
							Aucun conflit à résoudre.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}
