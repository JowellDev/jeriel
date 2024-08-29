import { type ColumnDef } from '@tanstack/react-table'
import { formatDate } from '~/utils/date'
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
		accessorKey: 'createdAt',
		header: 'Date de création',
		cell: ({ row }) => {
			return <div>{formatDate(row.original.createdAt)}</div>
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
		header: 'Actions',
	},
]
