import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { PieStatistics, type StatisticItem } from '../pie-statistics'
import { AttendanceState } from '~/shared/enum'
import { frenchAttendanceState } from '~/shared/constants'
import { getStatsAttendanceState } from '~/shared/attendance'
import { type MembersStats } from './types'
import { Skeleton } from '~/components/ui/skeleton'

interface AdminStatisticsProps {
	title?: string
	members: MembersStats[]
	isFetching?: boolean
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
	isFetching,
}: AdminStatisticsProps) => {
	const calculateStatistics = () => {
		const counters = {
			[AttendanceState.VERY_REGULAR]: 0,
			[AttendanceState.REGULAR]: 0,
			[AttendanceState.MEDIUM_REGULAR]: 0,
			[AttendanceState.LITTLE_REGULAR]: 0,
			[AttendanceState.ABSENT]: 0,
		}

		members.forEach(member => {
			const { monthAttendanceResume, sundays } = member

			if (monthAttendanceResume === null || monthAttendanceResume === 0) {
				return
			}

			const state = getStatsAttendanceState(monthAttendanceResume, sundays)
			counters[state]++
		})

		const statistics: StatisticItem[] = Object.entries(counters).map(
			([key, value]) => ({
				name: frenchAttendanceState[key as AttendanceState],
				value,
				color: defaultColors[key as AttendanceState],
			}),
		)

		return statistics.filter(item => item.value > 0)
	}

	const statistics = calculateStatistics()
	const total = members.length

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
							{isFetching ? (
								<Skeleton className="w-9 h-12 rounded-md" />
							) : (
								<div className="text-5xl font-bold text-gray-800">{total}</div>
							)}
							<div className="text-xl text-gray-600 mt-2">Total</div>
						</div>

						<div className="col-span-3">
							<PieStatistics
								data={statistics}
								total={total}
								isFetching={isFetching}
							/>
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
							{isFetching ? (
								<Skeleton className="w-7 h-9 rounded-md" />
							) : (
								<div className="text-4xl font-bold text-gray-800">{total}</div>
							)}
							<div className="text-base text-gray-600">Total</div>
						</div>

						<PieStatistics
							data={statistics}
							total={total}
							isMobile={true}
							isFetching={isFetching}
						/>
					</div>
				</CardContent>
			</div>
		</Card>
	)
}

export default AdminStatistics
