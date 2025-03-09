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
		{ name: 'Très-régulier', value: 280, color: '#34C759' },
		{ name: 'Peu régulier', value: 100, color: '#FFCC00' },
		{ name: 'Régulier', value: 100, color: '#FF9500' },
		{ name: 'Moyennement régulier', value: 98, color: '#BF6A02' },
		{ name: 'Absent', value: 100, color: '#FF2D55' },
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
		</Card>
	)
}

export default AdminStatistics
