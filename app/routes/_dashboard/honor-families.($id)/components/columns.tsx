import { type ColumnDef } from '@tanstack/react-table'
import { formatDate } from '~/utils/date'
import { HonorFamily } from '../types'

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
			const { createdAt } = row.original

			return <div>{formatDate(createdAt)}</div>
		},
	},
	{
		accessorKey: 'admin.name',
		header: `Nom du responsable`,
	},
	{
		accessorKey: 'admin.phone',
		header: `Numéro de téléphone`,
	},
	{
		id: 'actions',
		header: 'Actions',
	},
]
