import { type ColumnDef } from '@tanstack/react-table'
import type { Department } from '../model'
import TruncateTooltip from '~/components/truncate-tooltip'

export const columns: ColumnDef<Department>[] = [
	{
		accessorKey: 'name',
		header: 'Nom',
		cell: ({ row }) => <TruncateTooltip text={row.original.name} />,
	},
	{
		accessorKey: 'members',
		header: 'Nombre de Membres',
		cell: ({ row }) => row.original.members.length,
	},
	{
		accessorKey: 'manager.name',
		header: 'Responsable',
		cell: ({ row }) => <TruncateTooltip text={row.original.manager.name} />,
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
