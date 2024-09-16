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

const chartData = [
	{ month: 'January', desktop: 186, mobile: 80 },
	{ month: 'February', desktop: 305, mobile: 200 },
	{ month: 'March', desktop: 237, mobile: 120 },
	{ month: 'April', desktop: 73, mobile: 190 },
	{ month: 'May', desktop: 209, mobile: 130 },
	{ month: 'June', desktop: 214, mobile: 140 },
	{ month: 'July', desktop: 186, mobile: 80 },
	{ month: 'August', desktop: 305, mobile: 200 },
	{ month: 'September', desktop: 237, mobile: 120 },
	{ month: 'October', desktop: 73, mobile: 190 },
	{ month: 'November', desktop: 209, mobile: 130 },
	{ month: 'December', desktop: 214, mobile: 140 },
]

export default function GlobalStats() {
	return (
		<div className="grid sm:grid-cols-2 gap-8">
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
				className="min-h-[200px] w-full pt-4"
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
					<YAxis tickLine={false} tickMargin={10} axisLine={false} />
					<ChartTooltip content={<ChartTooltipContent />} />
					<ChartLegend
						content={<ChartLegendContent />}
						className="justify-start"
					/>
					<Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
					<Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
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
				className="min-h-[150px] w-full pt-4"
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
					<Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
					<Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
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
				className="min-h-[150px] w-full pt-4"
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
					<Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
					<Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
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
				className="min-h-[150px] w-full pt-4"
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
					<Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
					<Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
				</BarChart>
			</ChartContainer>
		</StatsCard>
	)
}
