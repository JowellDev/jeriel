import { LineChart, CartesianGrid, XAxis, Line, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '~/components/ui/chart'

import type { AttendanceAdminStats, LineChartConfig } from '../../types'

interface LineChartCardProps {
	data: AttendanceAdminStats[]
	config: LineChartConfig
}

export function LineChartCard({ data, config }: Readonly<LineChartCardProps>) {
	return (
		<Card className="w-full overflow-hidden shadow-sm">
			<CardHeader>
				<CardTitle className="">Évolution mensuelle des présences</CardTitle>
			</CardHeader>
			<CardContent className="p-0 h-[400px]">
				<ChartContainer
					config={config}
					className="aspect-auto h-full w-full pr-4"
				>
					<LineChart accessibilityLayer data={data}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={10}
							tickFormatter={(value: string) => value.toUpperCase().slice(0, 3)}
						/>
						<YAxis axisLine={false} tickLine={false} />
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<Line
							dataKey="presences"
							type="monotone"
							stroke="var(--color-presences)"
							strokeWidth={2}
							dot={false}
						/>
						<Line
							dataKey="absences"
							type="monotone"
							stroke="var(--color-absences)"
							strokeWidth={2}
							dot={false}
						/>
						<ChartLegend
							content={<CustomChartLegend />}
							iconType="square"
							align="right"
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}

const CustomChartLegend = (props: any) => {
	return (
		<div className="flex flex-col">
			<ChartLegendContent {...props} className="flex justify-start m-0 ml-10" />
		</div>
	)
}
