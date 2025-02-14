import { PieChart, Pie, LabelList } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '~/components/ui/chart'
import type { EntityData, PieChartConfig } from '../../types'

interface PieChartCardProps {
	title: string
	data: EntityData[]
	config: PieChartConfig
	newCount: number
	oldCount: number
}
export function PieChartCard({
	title,
	data,
	config,
	newCount,
	oldCount,
}: Readonly<PieChartCardProps>) {
	return (
		<Card className="w-full shadow-none border-none">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>

			<CardContent className="grid sm:grid-cols-6 md:grid-cols-5 lg:grid-cols-5">
				<div className="sm:col-span-3 lg:col-span-3">
					<ChartContainer
						config={config}
						className="mx-auto aspect-square lg:max-h-[215px] md:max-h-[215px] sm:max-h-[215px]"
					>
						<PieChart>
							<ChartTooltip
								cursor={false}
								content={<ChartTooltipContent hideLabel />}
							/>
							<Pie data={data} dataKey="members" nameKey="member">
								<LabelList
									dataKey="member"
									className="fill-background"
									stroke="none"
									fontSize={14}
									fontWeight={600}
									formatter={(key: keyof typeof config) =>
										`${config[key]?.value}%`
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
							{newCount}
						</div>
					</div>

					<div className="flex flex-col items-center justify-center">
						<span className="font-bold text-[#F68D2B]">Anciens</span>
						<div className="text-lg sm:text-xl font-bold rounded-md p-2 bg-[#F68D2B] w-fit text-white">
							{oldCount}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
