import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { PieStatistics, type StatisticItem } from '../pie-statistics'

interface AdminStatisticsProps {
	title?: string
	statistics?: StatisticItem[]
	total?: number
}

const AdminStatistics = ({
	title = 'Nouveaux membres',
	statistics = [
		{ name: 'Très-régulier', value: 400, color: '#34C759' },
		{ name: 'Peu régulier', value: 100, color: '#FFCC00' },
		{ name: 'Régulier', value: 50, color: '#FF9500' },
		{ name: 'Moyennement régulier', value: 78, color: '#BF6A02' },
		{ name: 'Absent', value: 50, color: '#FF2D55' },
	],
	total = 678,
}: AdminStatisticsProps) => {
	const calculatedTotal = statistics.reduce(
		(sum, entry) => sum + entry.value,
		0,
	)
	const displayTotal = total || calculatedTotal

	return (
		<Card className="w-full">
			{/* Desktop View */}
			<div className="hidden sm:block">
				<CardHeader>
					<CardTitle className="text-lg font-bold text-gray-600">
						{title}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-4 gap-2">
						<div className="flex flex-col col-span-1 items-center justify-center border-r border-gray-400">
							<div className="text-5xl font-bold text-gray-800">
								{displayTotal}
							</div>
							<div className="text-xl text-gray-600 mt-2">Total</div>
						</div>

						<div className="col-span-3">
							<PieStatistics data={statistics} total={displayTotal} />
						</div>
					</div>
				</CardContent>
			</div>

			{/* Mobile View */}
			<div className="block sm:hidden">
				<CardHeader className="p-4">
					<CardTitle className="text-base font-bold text-gray-600">
						{title}
					</CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<div className="flex flex-col">
						<div className="flex flex-col mb-4">
							<div className="text-4xl font-bold text-gray-800">
								{displayTotal}
							</div>
							<div className="text-base text-gray-600">Total</div>
						</div>

						<PieStatistics
							data={statistics}
							total={displayTotal}
							isMobile={true}
						/>
					</div>
				</CardContent>
			</div>
		</Card>
	)
}

export default AdminStatistics
