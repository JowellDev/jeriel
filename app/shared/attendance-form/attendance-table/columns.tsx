import { type ColumnDef } from '@tanstack/react-table'
import TruncateTooltip from '~/components/truncate-tooltip'
import { type z } from 'zod'
import { type memberAttendanceSchema } from '~/routes/api/mark-attendance/schema'
import { getMonthSundays, getSundayIndex } from '~/utils/date'

export type MemberAttendanceData = z.infer<typeof memberAttendanceSchema>

interface ColumnProps {
	currentDay: Date
	hasActiveService: boolean
}

export function getColumns({
	currentDay,
	hasActiveService,
}: ColumnProps): ColumnDef<MemberAttendanceData>[] {
	const currentMonthSundays = getMonthSundays(currentDay)
	const sundayIndex = getSundayIndex(currentDay, currentMonthSundays)

	const baseColumns = [
		{
			accessorKey: 'name',
			header: 'Nom & prénoms',
			cell: ({ row }: { row: { original: MemberAttendanceData } }) => (
				<TruncateTooltip text={row.original.name} />
			),
		},
		{
			accessorKey: 'churchAttendance',
			header: () => (
				<div className="flex flex-col divide-y divide-neutral-300 py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence aux cultes</p>
					<div className="flex justify-center items-center">
						<span key={currentDay.toISOString()}>Culte D{sundayIndex}</span>
					</div>
				</div>
			),
		},
	]

	if (hasActiveService) {
		baseColumns.splice(1, 0, {
			accessorKey: 'serviceAttendance',
			header: () => (
				<div className="flex flex-col divide-y divide-neutral-300 py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence aux services</p>
					<div className="flex justify-center items-center">
						<span key={currentDay.toISOString()}>Service T{sundayIndex}</span>
					</div>
				</div>
			),
		})
	}

	return baseColumns
}
