import { type RemixiconComponentType } from '@remixicon/react'
import * as React from 'react'
import { BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from '~/components/ui/chart'
import { chartAttendanceStateEmoji } from '~/shared/constants'

export type StatsCardProps = React.PropsWithChildren<{
	title: React.ReactNode | string
	Icon?: RemixiconComponentType
	otherInfos?: string
}>

export interface AttendanceChartCardProps {
	Icon: RemixiconComponentType
	title: string
	subTitle: string
	chartData: any[]
	config: ChartConfig
	displayComparaisonChart?: boolean
}

export function StatsCard({
	title,
	Icon,
	otherInfos,
	children,
}: Readonly<StatsCardProps>) {
	return (
		<Card>
			<CardHeader className="bg-[#226C67] rounded-t-md text-white text-sm sm:text-md p-3 sm:p-4">
				<div className="flex items-center space-x-2">
					{Icon && <Icon />}
					<div className="flex flex-col space-y-1">
						<span>{title}</span>
						{otherInfos && <span className="text-xs">{otherInfos}</span>}
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-0">{children}</CardContent>
		</Card>
	)
}

export const AttendanceChartCard = ({
	displayComparaisonChart = true,
	...props
}: Readonly<AttendanceChartCardProps>) => {
	return (
		<StatsCard
			Icon={props.Icon}
			title={props.title}
			otherInfos={props.subTitle}
		>
			<ChartContainer
				config={props.config}
				className="min-h-[100px] w-full relative -left-8 sm:-left-0 pt-4"
			>
				<BarChart accessibilityLayer data={props.chartData} className="p-0">
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
						className="text-[12px] sm:text-xl p-0 sm:p-0"
						tickFormatter={value => chartAttendanceStateEmoji[value] ?? ''}
					/>
					<ChartTooltip content={<ChartTooltipContent />} />
					<ChartLegend content={<ChartLegendContent />} className="mb-4" />
					<Bar
						dataKey="desktop"
						fill="var(--color-desktop)"
						radius={4}
						barSize={10}
					/>
					{displayComparaisonChart && (
						<Bar
							dataKey="mobile"
							fill="var(--color-mobile)"
							radius={4}
							barSize={10}
						/>
					)}
				</BarChart>
			</ChartContainer>
		</StatsCard>
	)
}
