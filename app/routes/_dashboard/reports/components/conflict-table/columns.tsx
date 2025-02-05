import { type ColumnDef } from '@tanstack/react-table'
import type { AttendanceReport } from '../../model'

export const columns: ColumnDef<AttendanceReport>[] = [
	{
		accessorKey: 'user',
		header: 'Membres',
	},
	{
		accessorKey: 'entity',
		header: 'Département / Tribu',
	},
	{
		accessorKey: 'createdAt',
		header: 'Date',
	},

	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
