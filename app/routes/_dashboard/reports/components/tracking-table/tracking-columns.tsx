import { type ColumnDef } from '@tanstack/react-table'
import TruncateTooltip from '~/components/truncate-tooltip'
import type { ReportTracking } from '../../model'
import { formatDate } from '~/utils/date'
import { Badge } from '~/components/ui/badge'

export const trackingColumns: ColumnDef<ReportTracking>[] = [
	{
		accessorKey: 'entity',
		header: "Tribu/ Département/ Famille d'honneur",
		cell: ({ row }) => {
			const report = row.original
			const { entityName, entityType } = getEntityValues(report)

			return (
				<TruncateTooltip
					text={`${entityType} - ${entityName}`}
					maxLength={40}
				/>
			)
		},
	},
	{
		accessorKey: 'managerName',
		header: 'Responsable',
		cell: ({ row }) => {
			const report = row.original
			const { managerName } = getEntityValues(report)

			return managerName
		},
	},
	{
		accessorKey: 'managerPhone',
		header: 'Téléphone',
		cell: ({ row }) => {
			const report = row.original
			const { managerPhone } = getEntityValues(report)

			return managerPhone
		},
	},
	{
		accessorKey: 'createdAt',
		header: 'Date de suivi',
		cell: ({ row }) => {
			return <div>{formatDate(row.original.createdAt)}</div>
		},
	},
	{
		accessorKey: 'submittedAt',
		header: 'Date de soumission',
		cell: ({ row }) => {
			return (
				<div>
					{row.original.submittedAt
						? formatDate(row.original.submittedAt, 'dd/MM/yyyy à HH:mm')
						: '--'}
				</div>
			)
		},
	},
	{
		header: 'Statut',
		cell: ({ row }) => {
			return row.original.submittedAt ? (
				<Badge variant="success">Transmis</Badge>
			) : (
				<Badge variant="warning">Non transmis</Badge>
			)
		},
	},
]

function getEntityValues(tracking: ReportTracking) {
	let entityType = ''
	let entityName: string | undefined
	let managerName: string | undefined
	let managerPhone: string | undefined

	switch (tracking.entity) {
		case 'DEPARTMENT':
			entityType = 'Département'
			entityName = tracking.department?.name
			managerName = tracking.department?.manager?.name
			managerPhone = tracking.department?.manager?.phone
			break
		case 'TRIBE':
			entityType = 'Tribu'
			entityName = tracking.tribe?.name
			managerName = tracking.tribe?.manager?.name
			managerPhone = tracking.tribe?.manager?.phone
			break
		case 'HONOR_FAMILY':
			entityType = "Famille d'honneur"
			entityName = tracking.honorFamily?.name
			managerName = tracking.honorFamily?.manager?.name
			managerPhone = tracking.honorFamily?.manager?.phone
			break
	}

	return { entityType, entityName, managerName, managerPhone }
}
