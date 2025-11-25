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
		accessorKey: 'managerEmail',
		header: 'Email',
		cell: ({ row }) => {
			const report = row.original
			const { managerEmail } = getEntityValues(report)

			return managerEmail
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
	let managerEmail: string | null | undefined

	switch (tracking.entity) {
		case 'DEPARTMENT':
			entityType = 'Département'
			entityName = tracking.department?.name
			managerName = tracking.department?.manager?.name
			managerEmail = tracking.department?.manager?.email
			break
		case 'TRIBE':
			entityType = 'Tribu'
			entityName = tracking.tribe?.name
			managerName = tracking.tribe?.manager?.name
			managerEmail = tracking.tribe?.manager?.email
			break
		case 'HONOR_FAMILY':
			entityType = "Famille d'honneur"
			entityName = tracking.honorFamily?.name
			managerName = tracking.honorFamily?.manager?.name
			managerEmail = tracking.honorFamily?.manager?.email
			break
	}

	return { entityType, entityName, managerName, managerEmail }
}
