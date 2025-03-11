import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { PieStatistics, type StatisticItem } from '../pie-statistics'
import { AttendanceState } from '~/shared/enum'
import { frenchAttendanceState } from '~/shared/constants'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { getMonthlyAttendanceState } from '~/shared/attendance'
import { isSameMonth } from 'date-fns'

interface AdminStatisticsProps {
	title?: string
	members: MemberMonthlyAttendances[]
	type: 'new' | 'old'
	colors?: Record<AttendanceState, string>
}

const defaultColors = {
	[AttendanceState.VERY_REGULAR]: '#34C759',
	[AttendanceState.REGULAR]: '#FF9500',
	[AttendanceState.MEDIUM_REGULAR]: '#BF6A02',
	[AttendanceState.LITTLE_REGULAR]: '#FFCC00',
	[AttendanceState.ABSENT]: '#FF2D55',
}

const AdminStatistics = ({
	title,
	members,
	type,
	colors = defaultColors,
}: AdminStatisticsProps) => {
	const filteredMembers = members.filter(member => {
		const isNewMember = isSameMonth(new Date(member.createdAt), new Date())
		return type === 'new' ? isNewMember : !isNewMember
	})
	const calculateStatistics = () => {
		const counters = {
			[AttendanceState.VERY_REGULAR]: 0,
			[AttendanceState.REGULAR]: 0,
			[AttendanceState.MEDIUM_REGULAR]: 0,
			[AttendanceState.LITTLE_REGULAR]: 0,
			[AttendanceState.ABSENT]: 0,
		}

		// Compter les membres par état d'assiduité
		filteredMembers.forEach(member => {
			const attendanceResume = member.currentMonthAttendanceResume

			if (attendanceResume) {
				const state = getMonthlyAttendanceState(attendanceResume)
				counters[state]++
			} else {
				counters[AttendanceState.ABSENT]++
			}
		})

		const statistics: StatisticItem[] = Object.entries(counters).map(
			([key, value]) => ({
				name: frenchAttendanceState[key as AttendanceState],
				value,
				color: colors[key as AttendanceState],
			}),
		)

		return statistics.filter(item => item.value > 0)
	}

	const statistics = calculateStatistics()
	const total = filteredMembers.length

	return (
		<Card className="w-full">
			<div className="hidden sm:block">
				<CardHeader>
					<CardTitle className="text-lg font-bold text-gray-600">
						{title}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-4 gap-2">
						<div className="flex flex-col col-span-1 items-center justify-center border-r border-gray-400">
							<div className="text-5xl font-bold text-gray-800">{total}</div>
							<div className="text-xl text-gray-600 mt-2">Total</div>
						</div>

						<div className="col-span-3">
							<PieStatistics data={statistics} total={total} />
						</div>
					</div>
				</CardContent>
			</div>

			<div className="block sm:hidden">
				<CardHeader className="p-4">
					<CardTitle className="text-base font-bold text-gray-600">
						{title}
					</CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<div className="flex flex-col">
						<div className="flex flex-col mb-4">
							<div className="text-4xl font-bold text-gray-800">{total}</div>
							<div className="text-base text-gray-600">Total</div>
						</div>

						<PieStatistics data={statistics} total={total} isMobile={true} />
					</div>
				</CardContent>
			</div>
		</Card>
	)
}

export default AdminStatistics
