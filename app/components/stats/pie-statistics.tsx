import { Cell, LabelList, Pie, PieChart } from 'recharts'

export interface StatisticItem {
	name: string
	value: number
	color: string
}

interface PieStatisticsProps {
	data: StatisticItem[]
	total: number
}

export const PieStatistics = ({ data, total }: PieStatisticsProps) => {
	return (
		<div className="flex justify-between">
			<div className="relative space-x-2 w-1/2">
				<PieChart width={300} height={300}>
					<Pie
						data={data}
						cx="50%"
						cy="50%"
						innerRadius={0}
						outerRadius={100}
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
			</div>

			<div className="flex flex-col w-1/2 justify-center">
				<div className="grid grid-cols-2 gap-y-2">
					{data.map((item, index) => (
						<div key={index} className="flex flex-col col-span-1">
							<div className="flex items-center">
								<div
									className="w-9 h-4 rounded mr-2"
									style={{ backgroundColor: item.color }}
								></div>
								<span className="text-xl font-bold text-gray-600">
									{item.value}
								</span>
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
