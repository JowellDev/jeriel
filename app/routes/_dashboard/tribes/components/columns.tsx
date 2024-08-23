import { type ColumnDef } from '@tanstack/react-table'

export const columns: ColumnDef<unknown>[] = [
	{
		accessorKey: 'name',
		header: 'Nom',
	},
	{
		accessorKey: 'members',
		header: 'membres',
	},
	{
		accessorKey: 'createdAt',
		header: 'Date de création',
	},
	{
		accessorKey: 'manager',
		header: 'Nom du responsable',
	},
	{
		accessorKey: 'manager',
		header: 'Numéro de téléphone',
	},

	{
		id: 'actions',
		header: 'Actions',
	},
]
