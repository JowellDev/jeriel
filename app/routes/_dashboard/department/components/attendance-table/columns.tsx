import { type ColumnDef } from '@tanstack/react-table'
import TruncateTooltip from '~/components/truncate-tooltip'
import { type z } from 'zod'
import { type memberAttendanceSchema } from '../../schema'

export type MemberAttendanceData = z.infer<typeof memberAttendanceSchema>

export const membersAttendanceMarkingColumns: ColumnDef<MemberAttendanceData>[] =
	[
		{
			accessorKey: 'name',
			header: 'Nom & prénoms',
			cell: ({ row }) => <TruncateTooltip text={row.original.name} />,
		},
		{
			id: 'actions',
			header: () => <div className="text-center">Actions</div>,
		},
	]
