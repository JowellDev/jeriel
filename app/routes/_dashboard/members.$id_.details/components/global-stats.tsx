import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
} from '~/components/ui/chart'
import StatsCard from './stats-card'
import {
	RiBuilding2Line,
	RiBuildingLine,
	RiHeartsLine,
	RiTeamLine,
} from '@remixicon/react'
import { chartConfig } from './chart-config'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { chartAttendanceStateEmoji } from '~/shared/constants'

const chartData = [
	{ month: 'January', desktop: 1, mobile: 1 },
	{ month: 'February', desktop: 2, mobile: 1 },
	{ month: 'March', desktop: 3, mobile: 3 },
	{ month: 'April', desktop: 4, mobile: 4 },
	{ month: 'May', desktop: 5, mobile: 2 },
	{ month: 'June', desktop: 4, mobile: 3 },
	{ month: 'July', desktop: 5, mobile: 5 },
	{ month: 'August', desktop: 5, mobile: 1 },
	{ month: 'September', desktop: 4, mobile: 2 },
	{ month: 'October', desktop: 1, mobile: 1 },
	{ month: 'November', desktop: 5, mobile: 4 },
	{ month: 'December', desktop: 2, mobile: 2 },
]

export default function GlobalStats() {
	return (
		<div className="grid sm:grid-cols-2 gap-6">
			<SundayAttendanceCard />
			<DepartmentServiceAttendanceCard />
			<HonoryFamilyAttendanceCard />
			<TribeServiceAttendanceCard />
		</div>
	)
}

const SundayAttendanceCard = () => {
	return (
		<StatsCard
			Icon={RiBuildingLine}
			title="Présence aux cultes"
			otherInfos="Date d'intégration 23 Mai 2023"
		>
			<ChartContainer
				config={chartConfig}
				className="min-h-[100px] w-full pt-4 px-2 sm:px-4"
			>
				<BarChart accessibilityLayer data={chartData}>
					<CartesianGrid vertical={false} strokeDasharray="3 3" />
					<XAxis
						dataKey="month"
						tickLine={false}
						tickMargin={10}
						axisLine={false}
						tickFormatter={value => value.slice(0, 3)}
					/>
					<YAxis
						axisLine={false}
						tickLine={false}
						domain={[1, 5]}
						ticks={[0, 1, 2, 3, 4, 5]}
						className="text-2xl"
						tickFormatter={value => chartAttendanceStateEmoji[value] ?? ''}
					/>
					<ChartTooltip content={<ChartTooltipContent />} />
					<ChartLegend content={<ChartLegendContent />} />
					<Bar
						dataKey="desktop"
						fill="var(--color-desktop)"
						radius={4}
						barSize={10}
					/>
				</BarChart>
			</ChartContainer>
		</StatsCard>
	)
}

const DepartmentServiceAttendanceCard = () => {
	return (
		<StatsCard
			Icon={RiBuilding2Line}
			title="Département | Communication"
			otherInfos="Date d'intégration 23 Mai 2023"
		>
			<ChartContainer
				config={chartConfig}
				className="min-h-[100px] w-full pt-4 px-2 sm:px-4"
			>
				<BarChart accessibilityLayer data={chartData}>
					<CartesianGrid vertical={false} strokeDasharray="3 3" />
					<XAxis
						dataKey="month"
						tickLine={false}
						tickMargin={10}
						axisLine={false}
						tickFormatter={value => value.slice(0, 3)}
					/>
					<YAxis
						axisLine={false}
						tickLine={false}
						domain={[1, 5]}
						ticks={[0, 1, 2, 3, 4, 5]}
						className="text-2xl"
						tickFormatter={value => chartAttendanceStateEmoji[value] ?? ''}
					/>
					<ChartTooltip content={<ChartTooltipContent />} />
					<ChartLegend content={<ChartLegendContent />} />
					<Bar
						dataKey="desktop"
						fill="var(--color-desktop)"
						radius={4}
						barSize={10}
					/>
				</BarChart>
			</ChartContainer>
		</StatsCard>
	)
}

const HonoryFamilyAttendanceCard = () => {
	return (
		<StatsCard
			Icon={RiHeartsLine}
			title="Famille d'honneur | Joseph"
			otherInfos="Date d'intégration 23 Mai 2023"
		>
			<ChartContainer
				config={chartConfig}
				className="min-h-[100px] w-full pt-4 px-2 sm:px-4"
			>
				<BarChart accessibilityLayer data={chartData}>
					<CartesianGrid vertical={false} strokeDasharray="3 3" />
					<XAxis
						dataKey="month"
						tickLine={false}
						tickMargin={10}
						axisLine={false}
						tickFormatter={value => value.slice(0, 3)}
					/>
					<YAxis
						axisLine={false}
						tickLine={false}
						domain={[1, 5]}
						ticks={[0, 1, 2, 3, 4, 5]}
						className="text-2xl"
						tickFormatter={value => chartAttendanceStateEmoji[value] ?? ''}
					/>
					<ChartTooltip content={<ChartTooltipContent />} />
					<ChartLegend content={<ChartLegendContent />} />
					<Bar
						dataKey="desktop"
						fill="var(--color-desktop)"
						radius={4}
						barSize={10}
					/>
				</BarChart>
			</ChartContainer>
		</StatsCard>
	)
}

const TribeServiceAttendanceCard = () => {
	return (
		<StatsCard
			Icon={RiTeamLine}
			title="Tribu | Naphtaliy"
			otherInfos="Date d'intégration 23 Mai 2023"
		>
			<ChartContainer
				config={chartConfig}
				className="min-h-[100px] w-full pt-4 px-2 sm:px-4"
			>
				<BarChart accessibilityLayer data={chartData}>
					<CartesianGrid vertical={false} strokeDasharray="3 3" />
					<XAxis
						dataKey="month"
						tickLine={false}
						tickMargin={10}
						axisLine={false}
						tickFormatter={value => value.slice(0, 3)}
					/>
					<YAxis
						axisLine={false}
						tickLine={false}
						domain={[1, 5]}
						ticks={[0, 1, 2, 3, 4, 5]}
						tickFormatter={value => chartAttendanceStateEmoji[value] ?? ''}
						className="text-2xl"
					/>
					<ChartTooltip content={<ChartTooltipContent />} />
					<ChartLegend content={<ChartLegendContent />} />
					<Bar
						dataKey="desktop"
						fill="var(--color-desktop)"
						radius={4}
						barSize={10}
					/>
				</BarChart>
			</ChartContainer>
		</StatsCard>
	)
}
