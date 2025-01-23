import { type ColumnDef } from '@tanstack/react-table'
import { type HonorFamily } from '../types'

export const columns: ColumnDef<HonorFamily>[] = [
	{
		accessorKey: 'name',
		header: 'Nom',
	},
	{
		accessorKey: 'members.length',
		header: 'Membre',
		cell: ({ row }) => {
			return <div>{row.original.members.length}</div>
		},
	},
	{
		accessorKey: 'manager.name',
		header: `Nom du responsable`,
	},
	{
		accessorKey: 'manager.phone',
		header: `Numéro de téléphone`,
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
