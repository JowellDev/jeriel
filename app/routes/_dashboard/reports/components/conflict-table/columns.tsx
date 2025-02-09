import { type ColumnDef } from '@tanstack/react-table'
import type {
	AttendanceConflicts,
	MemberWithAttendancesConflicts,
} from '../../model'
import { formatDate } from '~/utils/date'

export const columns: ColumnDef<MemberWithAttendancesConflicts>[] = [
	{
		accessorKey: 'name',
		header: 'Nom et prénoms',
	},
	{
		accessorKey: 'attendances.report',
		header: 'Département / Tribu',
		cell: ({ row }) => {
			const { attendances } = row.original
			const { departementName, tribeName } = getEntitiesName(attendances)

			return (
				<div>
					{departementName} / {tribeName}
				</div>
			)
		},
	},
	{
		accessorKey: 'createdAt',
		header: 'Date',
		cell: ({ row }) => {
			const { attendances } = row.original

			return <div>{formatDate(attendances[0].date)}</div>
		},
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]

function getEntitiesName(attendances: AttendanceConflicts[]) {
	let departementName = ''
	let tribeName = ''

	const date = attendances[0].date

	attendances.forEach(conflict => {
		const { report } = conflict
		if (report.entity === 'DEPARTMENT' && report.department) {
			departementName = report.department.name
		}
		if (report.entity === 'TRIBE' && report.tribe) {
			tribeName = report.tribe.name
		}
	})

	return { departementName, tribeName, conflictDate: date }
}
