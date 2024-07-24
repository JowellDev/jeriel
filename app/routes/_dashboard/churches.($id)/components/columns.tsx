import { type ColumnDef } from '@tanstack/react-table'
import type { Church } from '../model'

export const columns: ColumnDef<Church>[] = [
	{
		accessorKey: 'name',
		header: 'Eglise',
	},
	{
		accessorKey: 'user.fullname',
		header: 'Administrateur',
	},
	{
		accessorKey: 'user.phone',
		header: 'Numéro de téléphone',
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
