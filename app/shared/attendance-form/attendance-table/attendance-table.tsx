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
import { Switch } from '~/components/ui/switch'
import { getColumns, type MemberAttendanceData } from './columns'
import { useEffect, useState } from 'react'
import { hasActiveServiceForDate } from '~/utils/date'
import type { AttendanceScope, Services } from './types'
import type { AttendanceReportEntity } from '@prisma/client'
interface Props {
	data: MemberAttendanceData[]
	onUpdateAttendance: (payload: {
		scope: AttendanceScope
		memberId: string
		isPresent: boolean
	}) => void
	entity: AttendanceReportEntity
	currentDay: Date
	services?: Services[]
}

export function MemberAttendanceMarkingTable({
	data,
	onUpdateAttendance,
	currentDay,
	services,
	entity,
}: Readonly<Props>) {
	const [hasActiveService, setHasActiveService] = useState(false)

	useEffect(() => {
		if (services) {
			const isActive = hasActiveServiceForDate(currentDay, services)
			setHasActiveService(isActive)
		}
	}, [services, currentDay])
	const columns = getColumns({
		entity,
		currentDay,
		hasActiveService,
	})

	const attendanceScope: Record<string, AttendanceScope> = {
		churchAttendance: 'church',
		serviceAttendance: 'service',
		meetingAttendance: 'meeting',
	}

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		enableRowSelection: true,
	})

	function handleOnSwitch(scope: string, memberId: string, isPresent: boolean) {
		const scopeValue = attendanceScope[scope] as AttendanceScope
		onUpdateAttendance({ scope: scopeValue, memberId, isPresent })
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

								return [
									'serviceAttendance',
									'churchAttendance',
									'meetingAttendance',
								].includes(cell.column.id) ? (
									<TableCell
										key={cell.id}
										className="min-w-48 sm:min-w-0 text-xs sm:text-sm text-center"
									>
										<Switch
											title="Présence"
											prefix="Présence"
											defaultChecked={true}
											className="data-[state=checked]:bg-green-500"
											onCheckedChange={value => {
												handleOnSwitch(
													cell.column.id,
													attendance.memberId,
													value,
												)
											}}
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
							Aucun membre.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}
