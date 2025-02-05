import { type ColumnDef } from '@tanstack/react-table'
import TruncateTooltip from '~/components/truncate-tooltip'
import { type z } from 'zod'
import { type memberAttendanceSchema } from '~/routes/api/mark-attendance/schema'
import type { AttendanceReportEntity } from '@prisma/client'

export type MemberAttendanceData = z.infer<typeof memberAttendanceSchema>

interface ColumnProps {
	currentDay: Date
	hasActiveService: boolean
	entity: AttendanceReportEntity
}

export function getColumns({
	currentDay,
	hasActiveService,
	entity,
}: ColumnProps): ColumnDef<MemberAttendanceData>[] {
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
					<p className="text-center">Présence au culte</p>
				</div>
			),
		},
	]

	const meetingColumns = [
		{
			accessorKey: 'name',
			header: 'Nom & prénoms',
			cell: ({ row }: { row: { original: MemberAttendanceData } }) => (
				<TruncateTooltip text={row.original.name} />
			),
		},
		{
			accessorKey: 'meetingAttendance',
			header: () => (
				<div className="flex flex-col divide-y divide-neutral-300 py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence aux réunions</p>
				</div>
			),
		},
	]

	if (hasActiveService) {
		baseColumns.splice(1, 0, {
			accessorKey: 'serviceAttendance',
			header: () => (
				<div className="flex flex-col divide-y divide-neutral-300 py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence au service</p>
				</div>
			),
		})
	}

	return entity === 'HONOR_FAMILY' ? meetingColumns : baseColumns
}
