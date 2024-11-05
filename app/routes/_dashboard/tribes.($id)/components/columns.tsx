import { type ColumnDef } from '@tanstack/react-table'
import { type Tribe } from '../types'
import { formatDate } from '~/utils/date'

export const columns: ColumnDef<Tribe>[] = [
	{
		accessorKey: 'name',
		header: 'Nom',
		cell: ({ row }) => {
			const { name } = row.original
			return <span className="text-[11px] sm:text-sm">{name}</span>
		},
	},
	{
		accessorKey: 'members',
		header: 'Membres',
		cell: ({ row }) => {
			const { members } = row.original
			return <span className="text-[11px] sm:text-sm">{members.length}</span>
		},
	},
	{
		accessorKey: 'createdAt',
		header: 'Date de création',
		cell: ({ row }) => {
			const { createdAt } = row.original

			return (
				<span className="text-[11px] sm:text-sm">{formatDate(createdAt)}</span>
			)
		},
	},
	{
		accessorKey: 'manager',
		header: 'Nom du responsable',
		cell: ({ row }) => {
			const { manager } = row.original
			return <span className="text-[11px] sm:text-sm">{manager.name}</span>
		},
	},
	{
		accessorKey: 'manager',
		header: 'Numéro de téléphone',
		cell: ({ row }) => {
			const { manager } = row.original
			return <span className="text-[11px] sm:text-sm">{manager.phone}</span>
		},
	},

	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
