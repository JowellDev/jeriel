import { type ColumnDef } from '@tanstack/react-table'
import TruncateTooltip from '~/components/truncate-tooltip'
import { AttendanceComment } from '~/components/attendance-comment'
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
				const { inService, comment } = row.original
				return (
					<div
						className={`flex items-center justify-center gap-0.5 ${inService === false ? 'text-red-800' : 'text-primary'} font-bold`}
					>
						{inService === true ? 'Présent' : 'Absent'}
						{comment && <AttendanceComment comment={comment} />}
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
			const { inChurch, comment } = row.original
			return (
				<div
					className={`flex items-center justify-center gap-0.5 ${inChurch === false ? 'text-red-800' : 'text-primary'} font-bold`}
				>
					{inChurch === true ? 'Présent' : 'Absent'}
					{comment && <AttendanceComment comment={comment} />}
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
				const { inMeeting, comment } = row.original
				return (
					<div
						className={`flex items-center justify-center gap-0.5 ${inMeeting === false ? 'text-red-800' : 'text-primary'} font-bold`}
					>
						{inMeeting === true ? 'Présent' : 'Absent'}
						{comment && <AttendanceComment comment={comment} />}
					</div>
				)
			},
		})
	}

	return columns
}
