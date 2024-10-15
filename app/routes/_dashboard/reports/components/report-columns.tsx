import { type ColumnDef } from '@tanstack/react-table'
import TruncateTooltip from '~/components/truncate-tooltip'
import type { ReportData } from '../model'
import { formatDate } from '~/utils/date'

export const reportColumns: ColumnDef<ReportData>[] = [
	{
		accessorKey: 'name',
		header: "Tribu/ Département/ Famille d'honneur",
		cell: ({ row }) => <TruncateTooltip text={row.original.name} />,
	},
	{
		accessorKey: 'createdAt',
		header: 'Date de soumission',
		cell: ({ row }) => {
			return <div>{formatDate(row.original.createdAt)}</div>
		},
	},
	{
		accessorKey: 'manager.name',
		header: 'Nom du responsable',
	},
	{
		accessorKey: 'manager.phone',
		header: 'Numéro de téléphone',
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
