import { Cell, Pie, PieChart } from 'recharts'

import { Skeleton } from '~/components/ui/skeleton'

import { type StatisticItem } from '../pie-statistics'

interface StatisticsProps {
	title: string
	statistics: StatisticItem[]
	total: number
}

interface ManagerStatisticsProps {
	newMemberStats: StatisticsProps
	oldMemberStats: StatisticsProps
	isFecthing?: boolean
}

function computeRate(presence: number, absence: number): number {
	const total = presence + absence
	return total > 0 ? Math.round((presence / total) * 100) : 0
}

export const ManagerStatistics = ({
	newMemberStats,
	oldMemberStats,
	isFecthing,
}: Readonly<ManagerStatisticsProps>) => {
	const newMembersPresence = newMemberStats.statistics[0]?.value ?? 0
	const oldMembersPresence = newMemberStats.statistics[1]?.value ?? 0
	const newMembersAbsence = oldMemberStats.statistics[0]?.value ?? 0
	const oldMembersAbsence = oldMemberStats.statistics[1]?.value ?? 0

	const newPresenceRate = computeRate(newMembersPresence, newMembersAbsence)
	const oldPresenceRate = computeRate(oldMembersPresence, oldMembersAbsence)
	const generalPresenceRate = computeRate(
		newMemberStats.total,
		oldMemberStats.total,
	)

	const presenceRates = [newPresenceRate, oldPresenceRate]
	const absenceRates = [100 - newPresenceRate, 100 - oldPresenceRate]
	const generalAbsenceRate = 100 - generalPresenceRate

	const StatisticsSection = ({
		title,
		statistics,
		total,
		overallRate,
		rates,
	}: Readonly<{
		title: string
		statistics: StatisticItem[]
		total: number
		overallRate: number
		rates: number[]
	}>) => {
		const isPresence = title.toLowerCase().includes('présence')

		return (
			<div className="w-full mb-8">
				<h2 className="text-base font-semibold text-gray-700 mb-4">{title}</h2>

				<div className="flex flex-col">
					<div className="w-full mb-4">
						{isFecthing ? (
							<Skeleton className="w-7 h-10 rounded-md" />
						) : (
							<span className="text-4xl font-bold text-gray-800 block">
								{total}
							</span>
						)}
						<span className="text-sm text-gray-600">
							{isPresence ? 'Présence moyenne générale' : 'Absence moyenne générale'}
							{' • '}
							<span className="font-medium">
								Taux : {overallRate}%
							</span>
						</span>
					</div>

					<div className="w-full flex flex-col items-center">
						<div className="w-full flex justify-center mb-2">
							{isFecthing ? (
								<div className="w-[200px] h-[200px]">
									<Skeleton className="w-[200px] h-[200px] rounded-full" />
								</div>
							) : total === 0 ? (
								<div className="w-[200px] h-[200px] flex items-center justify-center font-semibold text-gray-500">
									Pas de données
								</div>
							) : (
								<PieChart width={200} height={200}>
									<Pie
										data={statistics}
										cx="50%"
										cy="50%"
										innerRadius={0}
										outerRadius={100}
										paddingAngle={0}
										dataKey="value"
									>
										{statistics.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Pie>
								</PieChart>
							)}
						</div>

						<div className="w-full flex flex-col space-y-2">
							{statistics.map((item, index) => (
								<div key={index} className="flex items-center">
									{isFecthing ? (
										<Skeleton className="w-9 h-5 rounded mr-2" />
									) : (
										<>
											<div
												className="w-6 h-4 rounded mr-2"
												style={{ backgroundColor: item.color }}
											></div>
											<span className="text-base font-bold text-gray-700 mr-1">
												{item.value}
											</span>
											<span className="text-sm text-gray-500 mr-2">
												({rates[index]}%)
											</span>
										</>
									)}
									<span className="text-xs text-gray-600">{item.name}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="w-full bg-white rounded-sm p-4">
			<div className="block lg:hidden">
				<StatisticsSection
					title={newMemberStats.title}
					statistics={newMemberStats.statistics}
					total={newMemberStats.total}
					overallRate={generalPresenceRate}
					rates={presenceRates}
				/>

				<StatisticsSection
					title={oldMemberStats.title}
					statistics={oldMemberStats.statistics}
					total={oldMemberStats.total}
					overallRate={generalAbsenceRate}
					rates={absenceRates}
				/>
			</div>

			<div className="hidden lg:block">
				<div className="w-full mb-16">
					<h2 className="text-lg font-semibold text-gray-700 mb-8">
						{newMemberStats.title ?? ''}
					</h2>

					<div className="flex flex-row">
						<div className="w-1/3 flex flex-col justify-center items-center border-r border-gray-300 pr-6">
							{isFecthing ? (
								<Skeleton className="w-9 h-12 rounded-md" />
							) : (
								<span className="text-5xl font-bold text-gray-800">
									{newMemberStats.total}
								</span>
							)}
							<span className="text-md text-center text-gray-600 mt-2">
								Présence moyenne générale
							</span>
							{!isFecthing && (
								<span className="text-sm font-medium text-gray-700 mt-1">
									Taux : {generalPresenceRate}%
								</span>
							)}
						</div>

						<div className="w-2/3 flex justify-between">
							<div className="w-1/2">
								{isFecthing ? (
									<div className="w-[300px] h-[300px] p-10">
										<Skeleton className="w-[200px] h-[200px] rounded-full" />
									</div>
								) : newMemberStats.total === 0 ? (
									<div className="w-[300px] h-[300px] flex items-center justify-center font-semibold text-gray-500 text-lg">
										Pas de données
									</div>
								) : (
									<PieChart width={300} height={300}>
										<Pie
											data={newMemberStats.statistics}
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
										</Pie>
									</PieChart>
								)}
							</div>

							<div className="w-1/2 flex flex-col items-center justify-center space-y-3">
								{newMemberStats.statistics.map((item, index) => (
									<div key={index} className="flex flex-col w-48">
										<div className="flex items-center">
											{isFecthing ? (
												<Skeleton className="w-11 h-5 rounded mr-2" />
											) : (
												<>
													<div
														className="w-9 h-5 rounded mr-2"
														style={{ backgroundColor: item.color }}
													></div>
													<span className="text-xl font-bold text-gray-700 mr-1">
														{item.value}
													</span>
													<span className="text-sm text-gray-500">
														({presenceRates[index]}%)
													</span>
												</>
											)}
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
							{isFecthing ? (
								<Skeleton className="w-9 h-12 rounded-md" />
							) : (
								<span className="text-5xl font-bold text-gray-800">
									{oldMemberStats.total}
								</span>
							)}
							<span className="text-md text-center text-gray-600 mt-2">
								Absence moyenne générale
							</span>
							{!isFecthing && (
								<span className="text-sm font-medium text-gray-700 mt-1">
									Taux : {generalAbsenceRate}%
								</span>
							)}
						</div>

						<div className="w-2/3 flex justify-between">
							<div className="w-1/2">
								{isFecthing ? (
									<div className="w-[300px] h-[300px] p-10">
										<Skeleton className="w-[200px] h-[200px] rounded-full" />
									</div>
								) : oldMemberStats.total === 0 ? (
									<div className="w-[300px] h-[300px] flex items-center justify-center font-semibold text-gray-500 text-lg">
										Pas de données
									</div>
								) : (
									<PieChart width={300} height={300}>
										<Pie
											data={oldMemberStats.statistics}
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
										</Pie>
									</PieChart>
								)}
							</div>

							<div className="w-1/2 flex flex-col items-center justify-center space-y-3">
								{oldMemberStats.statistics.map((item, index) => (
									<div key={index} className="flex flex-col w-48">
										<div className="flex items-center">
											{isFecthing ? (
												<Skeleton className="w-11 h-5 rounded mr-2" />
											) : (
												<>
													<div
														className="w-9 h-5 rounded mr-2"
														style={{ backgroundColor: item.color }}
													></div>
													<span className="text-xl font-bold text-gray-700 mr-1">
														{item.value}
													</span>
													<span className="text-sm text-gray-500">
														({absenceRates[index]}%)
													</span>
												</>
											)}
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
