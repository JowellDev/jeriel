import { type ColumnDef } from '@tanstack/react-table'
import { type z } from 'zod'
import { MemberAvatar } from '~/components/member-avatar'
import { type memberAttendanceSchema } from '~/routes/api/mark-attendance/schema'
import type { AttendanceReportEntity } from '@prisma/client'

export type MemberAttendanceData = z.infer<typeof memberAttendanceSchema> & {
	pictureUrl?: string | null
}

interface ColumnProps {
	hasActiveService: boolean
	entity: AttendanceReportEntity
}

export function getColumns({
	hasActiveService,
	entity,
}: ColumnProps): ColumnDef<MemberAttendanceData>[] {
	const baseColumns = [
		{
			accessorKey: 'name',
			header: 'Nom & prénoms',
			cell: ({ row }: { row: { original: MemberAttendanceData } }) => (
				<div className="flex space-x-2 items-center">
					<MemberAvatar name={row.original.name} pictureUrl={row.original.pictureUrl} />
					<span>{row.original.name}</span>
				</div>
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
				<div className="flex space-x-2 items-center">
					<MemberAvatar name={row.original.name} pictureUrl={row.original.pictureUrl} />
					<span>{row.original.name}</span>
				</div>
			),
		},
		{
			accessorKey: 'meetingAttendance',
			header: () => (
				<div className="flex flex-col divide-y divide-neutral-300 py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence à la réunion</p>
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
