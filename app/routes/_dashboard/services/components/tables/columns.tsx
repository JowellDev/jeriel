import { type ColumnDef } from '@tanstack/react-table'
import type { ServiceData } from '../../types'
import { format } from 'date-fns'

export const columns: ColumnDef<ServiceData>[] = [
	{
		accessorKey: 'entity',
		header: 'Entité',
		cell: ({ row }) => {
			const { entity } = row.original
			return <span className="text-[11px] sm:text-sm">{entity.name}</span>
		},
	},
	{
		header: 'Dates',
		cell: ({ row }) => {
			const { start, end } = row.original
			const dateFormat = 'dd/MM/yyyy'

			return (
				<span className="text-[11px] sm:text-sm">
					{format(start, dateFormat)} - {format(end, dateFormat)}
				</span>
			)
		},
	},
	{
		header: 'Responsable',
		cell: ({ row }) => {
			const { entity } = row.original
			return (
				<span className="text-[11px] sm:text-sm">
					{entity.manager?.name ?? 'N/A'}
				</span>
			)
		},
	},
	{
		header: 'Contact',
		cell: ({ row }) => {
			const { entity } = row.original
			return (
				<span className="text-[11px] sm:text-sm">
					{entity.manager?.phone ?? 'N/A'}
				</span>
			)
		},
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
