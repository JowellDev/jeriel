import { type ColumnDef } from '@tanstack/react-table'
import type { ServiceData } from '../../types'
import { format } from 'date-fns'
import { Badge } from '~/components/ui/badge'

const getServiceStatus = (from: Date | string, to: Date | string) => {
	const now = new Date()

	if (now < new Date(from)) {
		return { label: 'À venir', variant: 'outline' as const }
	} else if (new Date(now) > new Date(to)) {
		return { label: 'Expiré', variant: 'destructive' as const }
	} else {
		return { label: 'En cours', variant: 'success' as const }
	}
}

export const managerColumns: ColumnDef<ServiceData>[] = [
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
		header: 'Période',
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
		header: 'Statut',
		cell: ({ row }) => {
			const { from, to } = row.original
			const status = getServiceStatus(from, to)

			return (
				<Badge variant={status.variant} className="text-[11px]">
					{status.label}
				</Badge>
			)
		},
	},
]
