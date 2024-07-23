import { type ColumnDef } from '@tanstack/react-table'

export type Church = {
	id: string
	name: string
	administratorName: string
	administratorPhoneNumber: string
}

export const columns: ColumnDef<Church>[] = [
	{
		accessorKey: 'name',
		header: 'Eglise',
	},
	{
		accessorKey: 'administratorName',
		header: 'Administrateur',
	},
	{
		accessorKey: 'administratorPhoneNumber',
		header: 'Numéro de téléphone',
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
