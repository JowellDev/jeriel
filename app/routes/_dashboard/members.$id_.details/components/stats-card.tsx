import { type RemixiconComponentType } from '@remixicon/react'
import type * as React from 'react'
import { BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from '~/components/ui/chart'
import {
	attendanceStateEmoji,
	chartAttendanceStateEmoji,
	frenchAttendanceState,
	servicefrenchAttendanceState,
} from '~/shared/constants'
import { type AttendanceState } from '~/shared/enum'

export interface AttendanceChartDataType {
	month: string
	sunday: number
	service: number
}

export type StatsCardProps = React.PropsWithChildren<{
	title: React.ReactNode | string
	Icon?: RemixiconComponentType
	otherInfos?: string
}>

export interface AttendanceChartCardProps {
	Icon: RemixiconComponentType
	title: string
	subTitle: string
	chartData: AttendanceChartDataType[]
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
				className="min-h-[200px] w-full relative -left-8 sm:-left-0 pt-4 pb-6"
			>
				<BarChart accessibilityLayer data={props.chartData} className="p-0">
					<CartesianGrid vertical={false} strokeDasharray="3" />
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
						className="text-[10px] sm:text-lg p-0 sm:p-0"
						tickFormatter={value => chartAttendanceStateEmoji[value] ?? ''}
					/>
					<ChartTooltip content={<ChartTooltipContent />} />
					<ChartLegend content={<CustomChartLegend />} className="mb-4" />
					<Bar
						dataKey="sunday"
						fill="var(--color-sunday)"
						radius={4}
						barSize={10}
					/>
					{displayComparaisonChart && (
						<Bar
							dataKey="service"
							fill="var(--color-service)"
							radius={4}
							barSize={10}
						/>
					)}
				</BarChart>
			</ChartContainer>
		</StatsCard>
	)
}

const CustomChartLegend = (props: any) => {
	const { payload } = props

	const isServiceChart = (payload as { dataKey: string }[]).some(
		({ dataKey }) => dataKey === 'service',
	)

	return (
		<div className="flex flex-col space-y-2 relative top-3 sm:top-4">
			<ChartLegendContent {...props} className="flex justify-start m-0 ml-10" />
			<div className="hidden relative left-9 sm:flex sm:flex-1 space-x-2">
				{Object.entries(frenchAttendanceState).map(([key, value]) => (
					<span key={key} className="flex items-center">
						<span className="text-lg">
							{attendanceStateEmoji[key as AttendanceState]}
						</span>
						<Badge variant="chart-legend">
							{isServiceChart
								? servicefrenchAttendanceState[key as AttendanceState]
								: value}
						</Badge>
					</span>
				))}
			</div>
		</div>
	)
}
