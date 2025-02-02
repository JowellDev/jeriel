import { PieChart, Pie, LabelList } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '~/components/ui/chart'
import { type ChartConfig } from '../../types'

interface Props {
	title: string
}

const chartData = [
	{ member: 'nouveaux', members: 20, fill: '#3BC9BF' },
	{ member: 'anciens', members: 80, fill: '#F68D2B' },
]
const chartConfig = {
	nouveaux: {
		label: 'Nouveaux',
		color: '#3BC9BF',
		value: 20,
	},
	anciens: {
		label: 'Anciens',
		color: '#F68D2B',
		value: 80,
	},
} satisfies ChartConfig

export function PieChartCard({ title }: Readonly<Props>) {
	return (
		<Card className="w-full shadow-none border-none">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>

			<CardContent className="grid sm:grid-cols-6 md:grid-cols-5 lg:grid-cols-5">
				<div className="sm:col-span-3 lg:col-span-3">
					<ChartContainer
						config={chartConfig}
						className="mx-auto aspect-square lg:max-h-[215px] md:max-h-[215px] sm:max-h-[215px]"
					>
						<PieChart>
							<ChartTooltip
								cursor={false}
								content={<ChartTooltipContent hideLabel />}
							/>
							<Pie data={chartData} dataKey="members" nameKey="member">
								<LabelList
									dataKey="member"
									className="fill-background"
									stroke="none"
									fontSize={14}
									fontWeight={600}
									formatter={(key: keyof typeof chartConfig) =>
										`${chartConfig[key]?.value}%`
									}
								/>
							</Pie>
						</PieChart>
					</ChartContainer>
				</div>
				<div className="sm:col-span-3 md:col-span-2 lg:col-span-2 flex justify-between">
					<div className="flex flex-col items-center justify-center">
						<span className="font-bold text-[#3BC9BF]">Nouveaux</span>
						<div className="text-lg sm:text-xl font-bold rounded-md p-2 bg-[#3BC9BF] w-fit text-white">
							11
						</div>
					</div>

					<div className="flex flex-col items-center justify-center">
						<span className="font-bold text-[#F68D2B]">Anciens</span>
						<div className="text-lg sm:text-xl font-bold rounded-md p-2 bg-[#F68D2B] w-fit text-white">
							300
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
