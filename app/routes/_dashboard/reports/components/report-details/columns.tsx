import { type ColumnDef } from '@tanstack/react-table'
import TruncateTooltip from '~/components/truncate-tooltip'
import type { AttendanceData, EntityType } from '../../model'

interface Props {
	entity?: EntityType
	data: AttendanceData[]
}

export function getColumns({
	entity,
	data,
}: Readonly<Props>): ColumnDef<AttendanceData>[] {
	const columns: ColumnDef<AttendanceData>[] = [
		{
			accessorKey: 'member',
			header: 'Nom & prénoms',
			cell: ({ row }) => <TruncateTooltip text={row.original.member.name} />,
		},
	]

	// Vérifier si au moins une entrée a des données de service
	const hasServiceData = data.some(
		entry => typeof entry.inService !== 'undefined' && entry.inService !== null,
	)

	// Ajout conditionnel de la colonne présence au service
	if (hasServiceData) {
		columns.push({
			accessorKey: 'inService',
			header: () => (
				<div className="flex flex-col divide-y divide-neutral-300 py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence au service</p>
				</div>
			),
			cell: ({ row }) => {
				const serviceAttendance = row.original.inService
				return (
					<div
						className={`${serviceAttendance === false ? 'text-red-800' : 'text-[#226C67]'} font-bold text-center`}
					>
						{serviceAttendance === true ? 'Présent' : 'Absent'}
					</div>
				)
			},
		})
	}

	// Ajout de la colonne présence au culte
	columns.push({
		accessorKey: 'inChurch',
		header: () => (
			<div className="flex flex-col divide-y divide-neutral-300 py-1 gap-1 text-xs sm:text-sm">
				<p className="text-center">Présence au culte</p>
			</div>
		),
		cell: ({ row }) => {
			const churchAttendance = row.original.inChurch
			return (
				<div
					className={`${churchAttendance === false ? 'text-red-800' : 'text-[#226C67]'} font-bold text-center`}
				>
					{churchAttendance === true ? 'Présent' : 'Absent'}
				</div>
			)
		},
	})

	// Ajout conditionnel de la colonne présence à la réunion pour les familles d'honneur
	if (entity === 'HONOR_FAMILY') {
		columns.push({
			accessorKey: 'inMeeting',
			header: () => (
				<div className="flex flex-col divide-y divide-neutral-300 py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence à la réunion</p>
				</div>
			),
			cell: ({ row }) => {
				const meetingAttendance = row.original.inMeeting
				return (
					<div
						className={`${meetingAttendance === false ? 'text-red-800' : 'text-[#226C67]'} font-bold text-center`}
					>
						{meetingAttendance === true ? 'Présent' : 'Absent'}
					</div>
				)
			},
		})
	}

	return columns
}
