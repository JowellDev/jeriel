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
			return (
				<div>{formatDate(row.original.createdAt, 'dd/MM/yyyy à HH:mm')}</div>
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
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]

function getEntityValues(report: AttendanceReport) {
	let entityType = ''
	let entityName: string | undefined
	let managerName: string | undefined
	let managerEmail: string | null | undefined

	switch (report.entity) {
		case 'DEPARTMENT':
			entityType = 'Département'
			entityName = report.department?.name
			managerName = report.department?.manager?.name
			managerEmail = report.department?.manager?.email
			break
		case 'TRIBE':
			entityType = 'Tribu'
			entityName = report.tribe?.name
			managerName = report.tribe?.manager?.name
			managerEmail = report.tribe?.manager?.email
			break
		case 'HONOR_FAMILY':
			entityType = "Famille d'honneur"
			entityName = report.honorFamily?.name
			managerName = report.honorFamily?.manager?.name
			managerEmail = report.honorFamily?.manager?.email
			break
	}

	return { entityType, entityName, managerName, managerEmail }
}
