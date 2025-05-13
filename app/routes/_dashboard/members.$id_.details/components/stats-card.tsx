import { type RemixiconComponentType } from '@remixicon/react'
import * as React from 'react'
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
			<CardHeader className="bg-[#226C67] rounded-t text-white text-sm px-4 sm:px-6 py-1">
				<div className="flex items-center space-x-2">
					{Icon && <Icon />}
					<div className="flex flex-col space-y-0.5">
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
				className="min-h-[160px] sm:h-[300px] w-full relative right-8 sm:right-6 pt-4 sm:pt-3"
			>
				<BarChart accessibilityLayer data={props.chartData}>
					<CartesianGrid
						vertical={false}
						strokeDasharray="3"
						height={200}
						y={50}
					/>
					<YAxis
						axisLine={false}
						tickLine={false}
						domain={['dataMin', 'dataMax']}
						ticks={[0, 1, 2, 3, 4, 5]}
						className="text-[8px] sm:text-[14px]"
						tickFormatter={value => chartAttendanceStateEmoji[value] ?? ''}
					/>
					<XAxis
						dataKey="month"
						axisLine={true}
						tickLine={false}
						tickMargin={6}
						tickFormatter={value => value.slice(0, 3)}
						className="text-[8px] sm:text-[10px]"
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
		<div className="flex flex-col space-y-2 relative left-0 sm:left-4">
			<ChartLegendContent
				{...props}
				className="flex justify-start ml-10 sm:ml-4"
			/>

			<div className="hidden sm:flex sm:flex-1 space-x-1 ml-4">
				{Object.entries(frenchAttendanceState).map(([key, value]) => (
					<span key={key} className="flex items-center">
						<span>{attendanceStateEmoji[key as AttendanceState]}</span>
						<Badge variant="chart-legend" className="text-xs">
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
