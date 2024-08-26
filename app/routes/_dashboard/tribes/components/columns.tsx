import { type ColumnDef } from '@tanstack/react-table'
import { type Tribe } from '../types'
import { formatDate } from '~/utils/date'

export const columns: ColumnDef<Tribe>[] = [
	{
		accessorKey: 'name',
		header: 'Nom',
	},
	{
		accessorKey: 'members',
		header: 'membres',
		cell: ({ row }) => {
			const { members } = row.original

			return members.length
		},
	},
	{
		accessorKey: 'createdAt',
		header: 'Date de création',
		cell: ({ row }) => {
			const { createdAt } = row.original

			return formatDate(createdAt)
		},
	},
	{
		accessorKey: 'manager',
		header: 'Nom du responsable',
		cell: ({ row }) => {
			const { tribeManager } = row.original
			return tribeManager.name
		},
	},
	{
		accessorKey: 'manager',
		header: 'Numéro de téléphone',
		cell: ({ row }) => {
			const { tribeManager } = row.original
			return tribeManager.phone
		},
	},

	{
		id: 'actions',
		header: 'Actions',
	},
]
