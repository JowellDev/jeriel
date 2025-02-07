import { type ColumnDef } from '@tanstack/react-table'
import type {
	AttendanceConflicts,
	MemberWithAttendancesConflicts,
} from '../../model'
import { formatDate } from '~/utils/date'

export const columns: ColumnDef<MemberWithAttendancesConflicts>[] = [
	{
		accessorKey: 'name',
		header: 'Membres',
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
			return <div>{formatDate(row.original.createdAt)}</div>
		},
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]

function getEntitiesName(attendances: AttendanceConflicts[]) {
	const conflicts = attendances.filter(
		conflict => conflict.hasConflict === true,
	)

	let departementName = ''
	let tribeName = ''

	conflicts.forEach(conflict => {
		const { report } = conflict
		if (report.entity === 'DEPARTMENT' && report.department) {
			departementName = report.department.name
		}
		if (report.entity === 'TRIBE' && report.tribe) {
			tribeName = report.tribe.name
		}
	})

	return { departementName, tribeName }
}
