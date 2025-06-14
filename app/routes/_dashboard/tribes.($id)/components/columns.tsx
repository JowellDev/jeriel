import { type ColumnDef } from '@tanstack/react-table'
import { type Tribe } from '../types'

export const columns: ColumnDef<Tribe>[] = [
	{
		accessorKey: 'name',
		header: 'Nom',
		cell: ({ row }) => row.original.name,
	},
	{
		accessorKey: 'members',
		header: 'Membres',
		cell: ({ row }) => row.original.members.length,
	},
	{
		accessorKey: 'manager.name',
		header: 'Responsable',
		cell: ({ row }) => row.original.manager?.name ?? 'N/A',
	},
	{
		accessorKey: 'manager.phone',
		header: 'Téléphone',
		cell: ({ row }) => row.original.manager?.phone ?? 'N/A',
	},

	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
