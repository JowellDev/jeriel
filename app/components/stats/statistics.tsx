import { Cell, LabelList, Pie, PieChart } from 'recharts'
import { useMediaQuery } from 'usehooks-ts'
import { Skeleton } from '~/components/ui/skeleton'
import { MOBILE_WIDTH } from '~/shared/constants'

export interface StatisticItem {
	name: string
	value: number
	color: string
}

export interface PieStatisticsProps {
	statistics: StatisticItem[]
	total: number
	isFetching?: boolean
}

export const PieStatistics = ({
	statistics,
	total,
	isFetching = false,
}: Readonly<PieStatisticsProps>) => {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const statsWithPercentage = statistics.map(stat => ({
		...stat,
		percentage: Math.round((stat.value / total) * 100),
	}))

	const chartWidth = isDesktop ? 300 : 200
	const chartHeight = isDesktop ? 300 : 200
	const outerRadius = isDesktop ? 100 : 80

	return (
		<div className="w-full flex flex-col lg:flex-row justify-between">
			<div className="w-full lg:w-1/2 flex justify-center items-center">
				{isFetching ? (
					<div className="w-[200px] h-[200px] lg:w-[300px] lg:h-[300px] p-10">
						<Skeleton className="w-full h-full rounded-full" />
					</div>
				) : total === 0 ? (
					<div className="w-[200px] h-[200px] lg:w-[300px] lg:h-[300px] flex items-center justify-center font-semibold text-gray-500 text-lg">
						Pas de données
					</div>
				) : (
					<div className="w-[250px] h-[250px] lg:w-[300px] lg:h-[300px] flex items-center justify-center">
						<PieChart width={chartWidth} height={chartHeight}>
							<Pie
								data={statistics}
								cx="50%"
								cy="50%"
								innerRadius={0}
								outerRadius={outerRadius}
								paddingAngle={0}
								dataKey="value"
							>
								{statistics.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={entry.color} />
								))}
								<LabelList
									dataKey="value"
									position="inside"
									fill="#FFFFFF"
									stroke="none"
									fontSize={isDesktop ? 16 : 14}
									fontWeight={600}
									formatter={(value: number) =>
										`${Math.round((value / total) * 100)}%`
									}
								/>
							</Pie>
						</PieChart>
					</div>
				)}
			</div>

			<div className="w-full lg:w-1/2 flex flex-col items-center justify-center space-y-2 lg:space-y-3 mt-4 lg:mt-0">
				{statsWithPercentage.map((item, index) => (
					<div key={index} className="flex flex-col w-full lg:w-48">
						<div className="flex items-center">
							{isFetching ? (
								<Skeleton className="w-11 h-5 rounded mr-2" />
							) : (
								<>
									<div
										className="w-6 h-4 lg:w-9 lg:h-5 rounded mr-2"
										style={{ backgroundColor: item.color }}
									></div>
									<span className="text-base lg:text-xl font-bold text-gray-700">
										{item.value}
									</span>
								</>
							)}
						</div>
						<div className="text-gray-600 text-start text-xs lg:text-sm">
							{item.name}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
