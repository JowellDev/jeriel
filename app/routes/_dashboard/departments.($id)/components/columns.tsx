import { type ColumnDef } from '@tanstack/react-table'
import type { Department } from '../model'

export const columns: ColumnDef<Department>[] = [
	{
		accessorKey: 'name',
		header: 'Nom',
	},
	{
		accessorKey: 'members',
		header: 'Nombre de Membres',
		cell: ({ row }) => row.original.members.length,
	},
	{
		accessorKey: 'manager.name',
		header: 'Responsable',
	},
	{
		accessorKey: 'manager.phone',
		header: 'Téléphone',
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
