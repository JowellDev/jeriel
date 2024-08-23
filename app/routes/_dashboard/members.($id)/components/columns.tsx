import { type ColumnDef } from '@tanstack/react-table'
import { format, isSameMonth, sub } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getcurrentMonthSundays } from '~/utils/date'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/utils/ui'
import type { MemberWithMonthlyAttendances } from '../types'
import {
	type AttendanceStatusEnum,
	attendanceEmoji,
	frenchAttendanceStatus,
	getMonthlyAttendanceStatus,
} from '~/shared/attendance'

const lastMonth = sub(new Date(), { months: 1 })
const currentMonthSundays = getcurrentMonthSundays()

export const columns: ColumnDef<MemberWithMonthlyAttendances>[] = [
	{
		accessorKey: 'name',
		header: 'Nom & prénoms',
		cell: ({ row }) => {
			const { name, createdAt } = row.original
			const isNewFairthful = isSameMonth(new Date(createdAt), new Date())

			return (
				<div className="flex space-x-2 items-center">
					<span>{name}</span>
					{isNewFairthful && <Badge variant="success">Nouveau</Badge>}
				</div>
			)
		},
	},
	{
		accessorKey: 'phone',
		header: 'Num de téléphone',
	},
	{
		accessorKey: 'lastMonthAttendanceResume',
		header: `Etat ${format(lastMonth, 'MMM yyyy', { locale: fr })}`,
		cell: ({ row }) => {
			const { lastMonthAttendanceResume } = row.original
			const status = getMonthlyAttendanceStatus(lastMonthAttendanceResume)

			return <StatusBadge status={status} />
		},
	},
	{
		accessorKey: 'currentMonthAttendances',
		header: () => (
			<div className="flex flex-col divide-y divide-neutral-300 py-1 gap-1">
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
				<div className="flex justify-between items-center">
					{currentMonthAttendances.map((day, index) => (
						<div
							key={index}
							className={`font-semibold ${day.isPresent ? 'text-green-700' : 'text-red-700'}`}
						>
							{day.isPresent ? 'Présent' : 'Absent'}
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
			const status = getMonthlyAttendanceStatus(currentMonthAttendanceResume)

			return <StatusBadge status={status} className="ml-8" />
		},
	},
	{
		id: 'actions',
		header: 'Actions',
	},
]

interface StatusBadgeProps {
	status: AttendanceStatusEnum
	className?: string
}

const StatusBadge = ({ status, className }: Readonly<StatusBadgeProps>) => {
	const emoji = attendanceEmoji[status]

	return (
		<div className={cn('flex items-center space-x-2', className)}>
			<span className="text-xl">{emoji}</span>
			<Badge variant="secondary">{frenchAttendanceStatus[status]}</Badge>
		</div>
	)
}
