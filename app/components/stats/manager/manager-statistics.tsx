import { Cell, LabelList, Pie, PieChart } from 'recharts'
import { type StatisticItem } from '../pie-statistics'

interface StatisticsProps {
	title?: string
	statistics?: StatisticItem[]
	total?: number
}

interface ManagerStatisticsProps {
	newMemberStats?: StatisticsProps
	oldMemberStats?: StatisticsProps
}

export const ManagerStatistics = ({
	newMemberStats = {
		title: 'Présence au culte',
		statistics: [
			{ name: 'Présence moyenne des nouveaux', value: 400, color: '#34C759' },
			{ name: 'Présence moyenne des anciens', value: 278, color: '#FFCC00' },
		],
		total: 678,
	},
	oldMemberStats = {
		title: 'Absence au culte',
		statistics: [
			{ name: 'Absence moyenne des nouveaux', value: 500, color: '#B71C1C' },
			{ name: 'Absence moyenne des anciens', value: 178, color: '#FF4D6A' },
		],
		total: 678,
	},
}: Readonly<ManagerStatisticsProps>) => {
	const calculatePercentages = (stats: StatisticItem[], total: number) => {
		return stats.map(stat => ({
			...stat,
			percentage: Math.round((stat.value / total) * 100),
		}))
	}

	const newStatsWithPercentage = calculatePercentages(
		newMemberStats.statistics ?? [],
		newMemberStats.total ?? 0,
	)
	const oldStatsWithPercentage = calculatePercentages(
		oldMemberStats.statistics ?? [],
		oldMemberStats.total ?? 0,
	)

	const StatisticsSection = ({
		title,
		statistics,
		total,
		statsWithPercentage,
	}: {
		title: string
		statistics: StatisticItem[]
		total: number
		statsWithPercentage: (StatisticItem & { percentage: number })[]
	}) => (
		<div className="w-full mb-8">
			<h2 className="text-base font-semibold text-gray-700 mb-4">{title}</h2>

			<div className="flex flex-col">
				{/* Total section - stacked in mobile */}
				<div className="w-full mb-4">
					<span className="text-4xl font-bold text-gray-800 block">
						{total}
					</span>
					<span className="text-sm text-gray-600">
						{title.toLowerCase().includes('présence')
							? 'Présence moyenne générale'
							: 'Absence moyenne générale'}
					</span>
				</div>

				{/* Chart and legend - stacked in mobile */}
				<div className="w-full flex flex-col items-center">
					{/* Chart */}
					<div className="w-full flex justify-center mb-2">
						<PieChart width={200} height={200}>
							<Pie
								data={statistics}
								cx="50%"
								cy="50%"
								innerRadius={0}
								outerRadius={80}
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
									fontSize={16}
									fontWeight={600}
									formatter={(value: number) =>
										`${Math.round((value / total) * 100)}%`
									}
								/>
							</Pie>
						</PieChart>
					</div>

					{/* Legend */}
					<div className="w-full flex flex-col space-y-2">
						{statsWithPercentage.map((item, index) => (
							<div key={index} className="flex items-center">
								<div
									className="w-6 h-4 rounded mr-2"
									style={{ backgroundColor: item.color }}
								></div>
								<span className="text-base font-bold text-gray-700 mr-2">
									{item.value}
								</span>
								<span className="text-xs text-gray-600">{item.name}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)

	return (
		<div className="w-full bg-white rounded-sm p-4">
			{/* Use CSS to handle different layouts between mobile and desktop */}
			<div className="block lg:hidden">
				{/* Mobile layout - sections stacked vertically */}
				<StatisticsSection
					title={newMemberStats.title ?? ''}
					statistics={newMemberStats.statistics ?? []}
					total={newMemberStats.total ?? 0}
					statsWithPercentage={newStatsWithPercentage}
				/>

				<StatisticsSection
					title={oldMemberStats.title ?? ''}
					statistics={oldMemberStats.statistics ?? []}
					total={oldMemberStats.total ?? 0}
					statsWithPercentage={oldStatsWithPercentage}
				/>
			</div>

			<div className="hidden lg:block">
				{/* Desktop layout - preserved from original */}
				<div className="w-full mb-16">
					<h2 className="text-lg font-semibold text-gray-700 mb-8">
						{newMemberStats.title ?? ''}
					</h2>

					<div className="flex flex-row">
						<div className="w-1/3 flex flex-col justify-center items-center border-r border-gray-300 pr-6">
							<span className="text-5xl font-bold text-gray-800">
								{newMemberStats.total ?? 0}
							</span>
							<span className="text-md text-center text-gray-600 mt-2">
								{newMemberStats.title?.toLowerCase().includes('présence')
									? 'Présence moyenne générale'
									: 'Absence moyenne générale'}
							</span>
						</div>

						<div className="w-2/3 flex justify-between">
							<div className="w-1/2">
								<PieChart width={300} height={300}>
									<Pie
										data={newMemberStats.statistics ?? []}
										cx="50%"
										cy="50%"
										innerRadius={0}
										outerRadius={100}
										paddingAngle={0}
										dataKey="value"
									>
										{(newMemberStats.statistics ?? []).map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
										<LabelList
											dataKey="value"
											position="inside"
											fill="#FFFFFF"
											stroke="none"
											fontSize={16}
											fontWeight={600}
											formatter={(value: number) =>
												`${Math.round((value / (newMemberStats.total ?? 0)) * 100)}%`
											}
										/>
									</Pie>
								</PieChart>
							</div>

							<div className="w-1/2 flex flex-col items-center justify-center space-y-3">
								{newStatsWithPercentage.map((item, index) => (
									<div key={index} className="flex flex-col w-48">
										<div className="flex items-center">
											<div
												className="w-9 h-5 rounded mr-2"
												style={{ backgroundColor: item.color }}
											></div>
											<span className="text-xl font-bold text-gray-700">
												{item.value}
											</span>
										</div>
										<div className="text-gray-600 text-start text-sm">
											{item.name}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				<div className="w-full mb-16">
					<h2 className="text-lg font-semibold text-gray-700 mb-8">
						{oldMemberStats.title ?? ''}
					</h2>

					<div className="flex flex-row">
						<div className="w-1/3 flex flex-col justify-center items-center border-r border-gray-300 pr-6">
							<span className="text-5xl font-bold text-gray-800">
								{oldMemberStats.total ?? 0}
							</span>
							<span className="text-md text-center text-gray-600 mt-2">
								{oldMemberStats.title?.toLowerCase().includes('présence')
									? 'Présence moyenne générale'
									: 'Absence moyenne générale'}
							</span>
						</div>

						<div className="w-2/3 flex justify-between">
							<div className="w-1/2">
								<PieChart width={300} height={300}>
									<Pie
										data={oldMemberStats.statistics ?? []}
										cx="50%"
										cy="50%"
										innerRadius={0}
										outerRadius={100}
										paddingAngle={0}
										dataKey="value"
									>
										{(oldMemberStats.statistics ?? []).map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
										<LabelList
											dataKey="value"
											position="inside"
											fill="#FFFFFF"
											stroke="none"
											fontSize={16}
											fontWeight={600}
											formatter={(value: number) =>
												`${Math.round((value / (oldMemberStats.total ?? 0)) * 100)}%`
											}
										/>
									</Pie>
								</PieChart>
							</div>

							<div className="w-1/2 flex flex-col items-center justify-center space-y-3">
								{oldStatsWithPercentage.map((item, index) => (
									<div key={index} className="flex flex-col w-48">
										<div className="flex items-center">
											<div
												className="w-9 h-5 rounded mr-2"
												style={{ backgroundColor: item.color }}
											></div>
											<span className="text-xl font-bold text-gray-700">
												{item.value}
											</span>
										</div>
										<div className="text-gray-600 text-start text-sm">
											{item.name}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
