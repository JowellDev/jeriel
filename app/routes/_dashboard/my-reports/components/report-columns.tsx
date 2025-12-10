import { type ColumnDef } from '@tanstack/react-table'
import TruncateTooltip from '~/components/truncate-tooltip'
import type { AttendanceReport } from '~/routes/_dashboard/reports/model'
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
		accessorKey: 'attendanceCount',
		header: 'Nombre de présences',
		cell: ({ row }) => {
			const report = row.original
			const presentCount = report.attendances.filter(
				a => a.inChurch === true,
			).length
			return <div className="text-center">{presentCount}</div>
		},
	},
	{
		accessorKey: 'totalMembers',
		header: 'Total de membres',
		cell: ({ row }) => {
			const report = row.original
			return <div className="text-center">{report.attendances.length}</div>
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

	switch (report.entity) {
		case 'DEPARTMENT':
			entityType = 'Département'
			entityName = report.department?.name
			break
		case 'TRIBE':
			entityType = 'Tribu'
			entityName = report.tribe?.name
			break
		case 'HONOR_FAMILY':
			entityType = "Famille d'honneur"
			entityName = report.honorFamily?.name
			break
	}

	return { entityType, entityName }
}
