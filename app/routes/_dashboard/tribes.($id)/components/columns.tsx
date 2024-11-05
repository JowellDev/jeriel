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
		accessorKey: 'manager',
		header: 'Nom du responsable',
		cell: ({ row }) => row.original.manager.name,
	},
	{
		accessorKey: 'manager',
		header: 'Numéro de téléphone',
		cell: ({ row }) => row.original.manager.phone,
	},

	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
