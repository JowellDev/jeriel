import { type ColumnDef } from '@tanstack/react-table'
import { type HonorFamily } from '../types'

export const columns: ColumnDef<HonorFamily>[] = [
	{
		accessorKey: 'name',
		header: 'Nom',
	},
	{
		accessorKey: 'members.length',
		header: 'Membres',
		cell: ({ row }) => {
			return <div>{row.original.members.length}</div>
		},
	},
	{
		accessorKey: 'manager.name',
		header: `Responsable`,
		cell: ({ row }) => {
			return <div>{row.original.manager?.name ?? 'N/D'}</div>
		},
	},
	{
		accessorKey: 'manager.phone',
		header: `Téléphone`,
		cell: ({ row }) => {
			return <div>{row.original.manager?.phone ?? 'N/D'}</div>
		},
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
