import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface ConflictResolutionData {
	name: string
	memberId: string
	tribeAttendanceId: string
	departmentAttendanceId: string
	date: Date | string
	tribePresence: boolean | undefined
	departmentPresence: boolean | undefined
	tribeName: string | undefined
	departmentName: string | undefined
}

export function getColumns(
	data?: ConflictResolutionData[],
): ColumnDef<ConflictResolutionData>[] {
	const tribeName = data?.[0].tribeName
	const deptName = data?.[0].departmentName
	return [
		{
			accessorKey: 'name',
			header: 'Nom et prénoms',
		},
		{
			accessorKey: 'date',
			header: 'Date',
			cell: ({ row }) => {
				const date = new Date(row.original.date)
				return format(date, 'PPP', { locale: fr })
			},
		},
		{
			id: 'tribePresence',
			header: () => {
				return (
					<div className="flex flex-col py-1 gap-1 text-xs sm:text-sm">
						<p className="text-center">Tribu - {tribeName}</p>
						<p className="text-center">Présence au culte</p>
					</div>
				)
			},
			accessorFn: row => `${row.tribeName} - ${row.tribePresence}`,
		},
		{
			id: 'departmentPresence',
			header: () => {
				return (
					<div className="flex flex-col py-1 gap-1 text-xs sm:text-sm">
						<p className="text-center">Département - {deptName}</p>
						<p className="text-center">Présence au culte</p>
					</div>
				)
			},
			accessorFn: row => `${row.departmentName} - ${row.departmentPresence}`,
		},
	]
}
