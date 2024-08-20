import { type ColumnDef } from '@tanstack/react-table'
import type {
	FairthfulWithMonthlyAttendances,
	MonthlyAttendance,
} from '../types'
import { format, sub } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getcurrentMonthSundays } from '~/utils/date'

const lastMonth = sub(new Date(), { months: 1 })
const currentMonthSundays = getcurrentMonthSundays()

const AttendanceStatus = {
	TRES_REGULIER: 'TRES REGULIER',
	REGULIER: 'REGULIER',
	MOYENNENMENT_REGULIER: 'MOYENNENMENT REGULIER',
	PEU_REGULIER: 'PEU REGULIER',
	ABSENT: 'ABSENT',
}

const AttendanceEmoji = {
	'TRES REGULIER': '🤩',
	REGULIER: '😇',
	'MOYENNENMENT REGULIER': '😊',
	'PEU REGULIER': '😐',
	ABSENT: '😭',
}

function getMonthAttendance(attendance: MonthlyAttendance) {
	const { attendace, sundays } = attendance
	const percentage = (attendace / sundays) * 100

	console.log('percentage', percentage)

	switch (true) {
		case percentage === 100:
			return AttendanceStatus.TRES_REGULIER
		case percentage >= 60 && percentage < 100:
			return AttendanceStatus.REGULIER
		case percentage >= 50 && percentage < 60:
			return AttendanceStatus.MOYENNENMENT_REGULIER
		case percentage < 50 && percentage > 0:
			return AttendanceStatus.PEU_REGULIER
		default:
			return AttendanceStatus.ABSENT
	}
}

export const columns: ColumnDef<FairthfulWithMonthlyAttendances>[] = [
	{
		accessorKey: 'name',
		header: 'Nom & prénoms',
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
			const status = getMonthAttendance(lastMonthAttendanceResume)

			return (
				<div className="flex space-x-2 items-center lowercase">
					<span className="text-2xl">{(AttendanceEmoji as any)[status]}</span>
					<span>{status}</span>
				</div>
			)
		},
	},
	{
		accessorKey: 'currentMonthAttendances',
		header: () => (
			<div className="flex flex-col divide-y divide-gray-300 py-1 gap-1">
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
						<span
							key={index}
							className={`font-semibold ${day.isPresent ? 'text-green-700' : 'text-red-700'}`}
						>
							{day.isPresent ? 'Présent' : 'Absent'}
						</span>
					))}
				</div>
			)
		},
	},
	{
		accessorKey: 'currentMonthAttendances',
		header: () => (
			<div className="ml-8">
				<span>Etat du mois</span>
			</div>
		),
		cell: ({ row }) => {
			const { currentMonthAttendanceResume } = row.original
			const status = getMonthAttendance(currentMonthAttendanceResume)

			return (
				<div className="flex items-center space-x-2 lowercase ml-8">
					<span className="text-xl">{(AttendanceEmoji as any)[status]}</span>
					<span>{status}</span>
				</div>
			)
		},
	},
	{
		id: 'actions',
		header: () => <div className="text-center">Actions</div>,
	},
]
