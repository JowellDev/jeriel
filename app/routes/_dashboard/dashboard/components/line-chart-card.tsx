import { LineChart, CartesianGrid, XAxis, Line, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '~/components/ui/chart'

const chartData = [
	{ month: 'Janvier', présence: 186, absence: 80 },
	{ month: 'Février', présence: 305, absence: 200 },
	{ month: 'Mars', présence: 237, absence: 120 },
	{ month: 'Avril', présence: 73, absence: 190 },
	{ month: 'Mai', présence: 209, absence: 130 },
	{ month: 'Juin', présence: 214, absence: 140 },
	{ month: 'Juillet', présence: 214, absence: 140 },
	{ month: 'Août', présence: 214, absence: 140 },
	{ month: 'Septembre', présence: 263, absence: 160 },
	{ month: 'Octobre', présence: 96, absence: 120 },
	{ month: 'Novembre', présence: 300, absence: 99 },
	{ month: 'Décembre', présence: 250, absence: 150 },
]

const chartConfig = {
	présence: {
		label: 'Présence',
		color: '#B5EAE7',
	},
	absence: {
		label: 'Absence',
		color: '#FF5742',
	},
} satisfies ChartConfig

export function LineChartCard() {
	return (
		<Card className="w-full shadow-none border-none">
			<CardHeader>
				<CardTitle>Présence aux cultes</CardTitle>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<LineChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							axisLine={false}
							tickMargin={5}
							tickFormatter={value => value.slice(0, 3)}
							height={30}
						/>
						<YAxis axisLine={false} tickLine={false} height={20} />
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<Line
							dataKey="présence"
							type="monotone"
							stroke="var(--color-présence)"
							strokeWidth={2}
							dot={false}
						/>
						<Line
							dataKey="absence"
							type="monotone"
							stroke="var(--color-absence)"
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}
