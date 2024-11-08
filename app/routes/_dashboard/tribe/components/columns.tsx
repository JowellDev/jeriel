import { type ColumnDef } from '@tanstack/react-table'
import { format, isSameMonth, sub } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/utils/ui'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { type AttendanceState } from '~/shared/enum'
import { attendanceStateEmoji, frenchAttendanceState } from '~/shared/constants'
import { getMonthlyAttendanceState } from '~/shared/attendance'
import { getMonthSundays } from '~/utils/date'

export function getColumns(
	currentMonth: Date,
): ColumnDef<MemberMonthlyAttendances>[] {
	const lastMonth = sub(currentMonth, { months: 1 })
	const currentMonthSundays = getMonthSundays(currentMonth)

	return [
		{
			accessorKey: 'name',
			header: 'Nom & prénoms',
			cell: ({ row }) => {
				const { name, createdAt } = row.original
				const isNewFairthful = isSameMonth(new Date(createdAt), currentMonth)

				return (
					<div className="flex space-x-4 items-center text-[11px] sm:text-sm">
						<span>{name}</span>
						{isNewFairthful && <Badge variant="success">Nouveau</Badge>}
					</div>
				)
			},
		},
		{
			accessorKey: 'phone',
			header: 'Téléphone',
		},
		{
			accessorKey: 'lastMonthAttendanceResume',
			header: `Etat ${format(lastMonth, 'MMM yyyy', { locale: fr })}`,
			cell: ({ row }) => {
				const { previousMonthAttendanceResume } = row.original
				if (!previousMonthAttendanceResume)
					return <span className="ml-16 text-neutral-600">▪️</span>

				const state = getMonthlyAttendanceState(previousMonthAttendanceResume)

				return <StatusBadge state={state} />
			},
		},
		{
			accessorKey: 'currentMonthAttendances',
			header: () => (
				<div className="flex flex-col divide-y divide-neutral-300 py-1 gap-1 text-xs sm:text-sm">
					<p className="text-center">Présence aux cultes</p>
					<div className="flex justify-between items-center">
						{currentMonthSundays.map((day, index) => (
							<span key={day.toISOString()}>D{index + 1}</span>
						))}
					</div>
				</div>
			),
			cell: ({ row }) => {
				const { currentMonthAttendances } = row.original

				return (
					<div className="flex justify-between items-center space-x-2 sm:space-x-0 text-[11px] sm:text-sm">
						{currentMonthAttendances.map((day, index) => (
							<div key={index}>
								{day.isPresent === null ? (
									<span className="text-neutral-600 text-center">▪️</span>
								) : (
									<div
										key={index}
										className={`font-semibold ${day.isPresent ? 'text-green-700' : 'text-red-700'}`}
									>
										{day.isPresent ? 'Présent' : 'Absent'}
									</div>
								)}
							</div>
						))}
					</div>
				)
			},
		},
		{
			id: 'currentMonthAttendanceResume',
			accessorKey: 'currentMonthAttendanceResume',
			header: () => <div className="ml-8">Etat du mois</div>,
			cell: ({ row }) => {
				const { currentMonthAttendanceResume } = row.original
				if (!currentMonthAttendanceResume)
					return <span className="ml-20 text-neutral-600">▪️</span>

				const state = getMonthlyAttendanceState(currentMonthAttendanceResume)

				return <StatusBadge state={state} className="ml-8" />
			},
		},
		{
			id: 'actions',
			header: () => <div className="text-center">Actions</div>,
		},
	]
}

interface StatusBadgeProps {
	state: AttendanceState
	className?: string
}

const StatusBadge = ({ state, className }: Readonly<StatusBadgeProps>) => {
	const emoji = attendanceStateEmoji[state]

	return (
		<div className={cn('flex items-center space-x-2', className)}>
			<span>{emoji}</span>
			<Badge variant="secondary">{frenchAttendanceState[state]}</Badge>
		</div>
	)
}
