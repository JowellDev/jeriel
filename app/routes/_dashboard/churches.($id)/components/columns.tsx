import { type ColumnDef } from '@tanstack/react-table'
import type { Church } from '../model'

export const columns: ColumnDef<Church>[] = [
	{
		accessorKey: 'name',
		header: 'Eglise',
	},
	{
		accessorKey: 'admin.fullname',
		header: 'Admin',
	},
	{
		accessorKey: 'admin.phone',
		header: 'Téléphone',
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
