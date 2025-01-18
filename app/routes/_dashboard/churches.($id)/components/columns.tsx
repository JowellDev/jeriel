import { type ColumnDef } from '@tanstack/react-table'
import type { Church } from '../model'

export const columns: ColumnDef<Church>[] = [
	{
		header: 'Eglise',
		cell: ({ row }) => {
			const { name } = row.original

			return (
				<div className="flex space-x-4 items-center text-[11px] sm:text-sm">
					{name}
				</div>
			)
		},
	},
	{
		header: 'Admin',
		cell: ({ row }) => {
			const { admin } = row.original

			return (
				<div className="flex space-x-4 items-center text-[11px] sm:text-sm">
					{admin.name}
				</div>
			)
		},
	},
	{
		accessorKey: 'admin.phone',
		header: 'Téléphone',
		cell: ({ row }) => {
			const { admin } = row.original

			return (
				<div className="flex space-x-4 items-center text-[11px] sm:text-sm">
					{admin.phone}
				</div>
			)
		},
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
