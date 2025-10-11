import { type ColumnDef } from '@tanstack/react-table'
import type { ServiceData } from '../../types'
import { format } from 'date-fns'
import { Badge } from '~/components/ui/badge'

export const columns: ColumnDef<ServiceData>[] = [
	{
		accessorKey: 'entity',
		header: 'Entité',
		cell: ({ row }) => {
			const { entity } = row.original
			const isDepartment = entity.type === 'department'

			return (
				<div className="flex space-x-4 items-center text-[11px] sm:text-sm">
					<span>{entity.name}</span>
					<Badge
						variant={isDepartment ? 'primary' : 'secondary'}
						className="text-[11px]"
					>
						{isDepartment ? 'Département' : 'Tribu'}
					</Badge>
				</div>
			)
		},
	},
	{
		header: 'Dates',
		cell: ({ row }) => {
			const { from, to } = row.original
			const dateFormat = 'dd/MM/yyyy'

			return (
				<span className="text-[11px] sm:text-sm">
					{format(from, dateFormat)} - {format(to, dateFormat)}
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
					{entity.manager?.name ?? 'N/D'}
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
					{entity.manager?.phone ?? 'N/D'}
				</span>
			)
		},
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
