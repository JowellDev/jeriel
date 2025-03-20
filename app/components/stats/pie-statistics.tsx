import { Cell, LabelList, Pie, PieChart } from 'recharts'
import { Skeleton } from '../ui/skeleton'

export interface StatisticItem {
	name: string
	value: number
	color: string
}

interface PieStatisticsProps {
	data: StatisticItem[]
	total: number
	isMobile?: boolean
	isFetching?: boolean
}

export const PieStatistics = ({
	data,
	total,
	isMobile = false,
	isFetching,
}: PieStatisticsProps) => {
	const chartWidth = isMobile ? 200 : 300
	const chartHeight = isMobile ? 200 : 300
	const outerRadius = isMobile ? 80 : 100

	if (isMobile) {
		return (
			<div className="flex flex-col items-center">
				<div className="w-full flex justify-center mb-4">
					{isFetching ? (
						<div className="w-[200px] h-[200px]">
							<Skeleton className="w-[180px] h-[180px] rounded-full" />
						</div>
					) : data.length === 0 ? (
						<div className="w-[200px] h-[200px] flex items-center justify-center font-semibold text-gray-500">
							Pas de données
						</div>
					) : (
						<PieChart width={chartWidth} height={chartHeight}>
							<Pie
								data={data}
								cx="50%"
								cy="50%"
								innerRadius={0}
								outerRadius={outerRadius}
								paddingAngle={0}
								dataKey="value"
							>
								{data.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={entry.color} />
								))}
								<LabelList
									dataKey="value"
									position="inside"
									fill="#FFFFFF"
									stroke="none"
									fontSize={14}
									fontWeight={600}
									formatter={(value: number) =>
										`${Math.round((value / total) * 100)}%`
									}
								/>
							</Pie>
						</PieChart>
					)}
				</div>

				<div className="w-full grid grid-cols-2 gap-2">
					{data.map((item, index) => (
						<div key={index} className="flex flex-col">
							<div className="flex items-center">
								{isFetching ? (
									<Skeleton className="w-9 h-5 rounded mr-2" />
								) : (
									<>
										<div
											className="w-9 h-5 rounded mr-2"
											style={{ backgroundColor: item.color }}
										></div>
										<span className="text-base font-bold text-gray-700 mr-2">
											{item.value}
										</span>
									</>
								)}
							</div>
							<div className="text-gray-600 text-xs font-semibold">
								{item.name}
							</div>
						</div>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className="flex justify-between">
			<div className="relative space-x-2 w-1/2">
				{isFetching ? (
					<div className="w-[300px] h-[300px] p-10">
						<Skeleton className="w-[200px] h-[200px] rounded-full" />
					</div>
				) : data.length === 0 ? (
					<div className="w-[300px] h-[300px] flex items-center justify-center font-semibold text-gray-500">
						Pas de données
					</div>
				) : (
					<PieChart width={chartWidth} height={chartHeight}>
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							innerRadius={0}
							outerRadius={outerRadius}
							paddingAngle={0}
							dataKey="value"
						>
							{data.map((entry, index) => (
								<Cell key={`cell-${index}`} fill={entry.color} />
							))}
							<LabelList
								dataKey="value"
								position="inside"
								fill="#FFFFFF"
								stroke="none"
								fontSize={14}
								fontWeight={600}
								formatter={(value: number) =>
									`${Math.round((value / total) * 100)}%`
								}
							/>
						</Pie>
					</PieChart>
				)}
			</div>

			<div className="flex flex-col w-1/2 justify-center">
				<div className="grid grid-cols-2 gap-y-2">
					{data.map((item, index) => (
						<div key={index} className="flex flex-col col-span-1">
							<div className="flex items-center">
								{isFetching ? (
									<Skeleton className="w-9 h-5 rounded mr-2" />
								) : (
									<>
										<div
											className="w-9 h-5 rounded mr-2"
											style={{ backgroundColor: item.color }}
										></div>
										<span className="text-base font-bold text-gray-700 mr-2">
											{item.value}
										</span>
									</>
								)}
							</div>
							<div className="text-gray-600 text-sm font-semibold">
								{item.name}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
