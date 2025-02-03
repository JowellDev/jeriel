import { type ColumnDef } from '@tanstack/react-table'
import TruncateTooltip from '~/components/truncate-tooltip'
import type { AttendanceData } from '../../model'

export function getColumns(currentDay: Date): ColumnDef<AttendanceData>[] {
	return [
		{
			accessorKey: 'name',
			header: 'Nom & prénoms',
			cell: ({ row }) => <TruncateTooltip text={row.original.member.name} />,
		},
		{
			accessorKey: 'inService',
			header: () => (
				<div className="flex flex-col divide-y divide-neutral-300 py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence aux services</p>
					<div className="flex justify-center items-center">
						<span key={currentDay.toISOString()}>Service T4</span>
					</div>
				</div>
			),
			cell: ({ row }) => {
				const serviceAttendance = row.original.inService
				return (
					<div
						className={`${serviceAttendance === false ? 'text-red-800' : 'text-[#226C67]'} font-bold text-center`}
					>
						{serviceAttendance === true ? 'Présent' : 'Absent'}
					</div>
				)
			},
		},
		{
			accessorKey: 'inChurch',
			header: () => (
				<div className="flex flex-col divide-y divide-neutral-300 py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence aux cultes</p>
					<div className="flex justify-center items-center">
						<span key={currentDay.toISOString()}>D4</span>
					</div>
				</div>
			),
			cell: ({ row }) => {
				const churchAttendance = row.original.inChurch
				return (
					<div
						className={`${churchAttendance === false ? 'text-red-800' : 'text-[#226C67]'} font-bold text-center`}
					>
						{churchAttendance === true ? 'Présent' : 'Absent'}
					</div>
				)
			},
		},
	]
}
