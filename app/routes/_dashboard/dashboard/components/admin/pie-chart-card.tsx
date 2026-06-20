import {
	PieStatistics,
	type StatisticItem,
} from '~/components/stats/statistics'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

interface StatisticsCardProps {
	title: string
	statistics: StatisticItem[]
	total: number
}

export function StatisticsCard({
	title,
	statistics,
	total,
}: Readonly<StatisticsCardProps>) {
	return (
		<Card className="w-full shadow-sm transition-shadow hover:shadow-md">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<PieStatistics
					statistics={statistics}
					total={total}
					isFetching={false}
				/>
			</CardContent>
		</Card>
	)
}
