import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface ConflictResolutionData {
	memberId: string
	name: string
	attendanceId: string
	date: Date | string
	tribePresence: boolean
	departmentPresence: boolean
	tribeName: string | null
	departmentName: string | null
}

export function getColumns(): ColumnDef<ConflictResolutionData>[] {
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
			header: ({ column }) => {
				const tribeName = column.getFacetedUniqueValues().values().next().value
				return (
					<div className="flex flex-col py-1 gap-1 text-xs sm:text-sm">
						<p className="text-center">Tribu - {tribeName}</p>
						<p className="text-center">Présence aux cultes</p>
					</div>
				)
			},
			accessorFn: row => `${row.tribeName} - ${row.tribePresence}`,
		},
		{
			id: 'departmentPresence',
			header: ({ column }) => {
				const deptName = column.getFacetedUniqueValues().values().next().value
				return (
					<div className="flex flex-col py-1 gap-1 text-xs sm:text-sm">
						<p className="text-center">Département - {deptName}</p>
						<p className="text-center">Présence aux cultes</p>
					</div>
				)
			},
			accessorFn: row => `${row.departmentName} - ${row.departmentPresence}`,
		},
	]
}
