import { type ColumnDef } from '@tanstack/react-table'
import TruncateTooltip from '~/components/truncate-tooltip'
import type { AttendanceReport } from '../../model'
import { formatDate } from '~/utils/date'

export const reportColumns: ColumnDef<AttendanceReport>[] = [
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
		accessorKey: 'createdAt',
		header: 'Date de soumission',
		cell: ({ row }) => {
			return <div>{formatDate(row.original.createdAt)}</div>
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
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]

function getEntityValues(report: AttendanceReport) {
	let entityType = ''
	let entityName: string | undefined
	let managerName: string | undefined
	let managerPhone: string | undefined

	switch (report.entity) {
		case 'DEPARTMENT':
			entityType = 'Département'
			entityName = report.department?.name
			managerName = report.department?.manager.name
			managerPhone = report.department?.manager.phone
			break
		case 'TRIBE':
			entityType = 'Tribu'
			entityName = report.tribe?.name
			managerName = report.tribe?.manager.name
			managerPhone = report.tribe?.manager.phone
			break
		case 'HONOR_FAMILY':
			entityType = "Famille d'honneur"
			entityName = report.honorFamily?.name
			managerName = report.honorFamily?.manager.name
			managerPhone = report.honorFamily?.manager.phone
			break
	}

	return { entityType, entityName, managerName, managerPhone }
}
