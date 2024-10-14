import { type ColumnDef } from '@tanstack/react-table'
import TruncateTooltip from '~/components/truncate-tooltip'
import { ReportData } from '../model'

export const reportColumns: ColumnDef<ReportData>[] = [
	{
		accessorKey: 'origin',
		header: "Tribu/Département/Famille d'honneur'",
	},
	{
		accessorKey: 'origin',
		header: 'Date de soumission',
	},
	{
		accessorKey: 'origin',
		header: 'Nom du responsable',
	},
	{
		accessorKey: 'origin',
		header: 'Numéro de téléphone',
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
