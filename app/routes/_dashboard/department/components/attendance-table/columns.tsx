import { type ColumnDef } from '@tanstack/react-table'
import TruncateTooltip from '~/components/truncate-tooltip'
import { type z } from 'zod'
import { type memberAttendanceSchema } from '../../schema'

export type MemberAttendanceData = z.infer<typeof memberAttendanceSchema>

export function getColumns(
	currentDay: Date,
): ColumnDef<MemberAttendanceData>[] {
	return [
		{
			accessorKey: 'name',
			header: 'Nom & prénoms',
			cell: ({ row }) => <TruncateTooltip text={row.original.name} />,
		},
		{
			accessorKey: 'serviceAttendance',
			header: () => (
				<div className="flex flex-col divide-y divide-neutral-300 py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence aux services</p>
					<div className="flex justify-center items-center">
						<span key={currentDay.toISOString()}>Service T4</span>
					</div>
				</div>
			),
		},
		{
			accessorKey: 'churchAttendance',
			header: () => (
				<div className="flex flex-col divide-y divide-neutral-300 py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence aux cultes</p>
					<div className="flex justify-center items-center">
						<span key={currentDay.toISOString()}>D4</span>
					</div>
				</div>
			),
		},
	]
}
