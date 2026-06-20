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
		<Card className="overflow-hidden">
			<CardHeader className="bg-primary text-primary-foreground text-sm px-4 sm:px-6 py-3">
				<div className="flex items-center gap-2">
					{Icon && <Icon className="shrink-0" size={20} />}
					<div className="flex min-w-0 flex-col space-y-0.5">
						<span className="truncate font-semibold">{title}</span>
						{otherInfos && (
							<span className="truncate text-xs text-primary-foreground/80">
								{otherInfos}
							</span>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent className="overflow-hidden p-0">{children}</CardContent>
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
				className="aspect-auto h-[240px] w-full px-2 pt-4 sm:h-[300px] sm:pt-3"
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
					<ChartLegend
						content={<ChartLegendContent />}
						className="flex-wrap justify-center"
					/>
					<Bar
						dataKey="sunday"
						fill="var(--color-sunday)"
						radius={4}
						barSize={12}
					/>
					{displayComparaisonChart && (
						<Bar
							dataKey="service"
							fill="var(--color-service)"
							radius={4}
							barSize={12}
						/>
					)}
				</BarChart>
			</ChartContainer>

			<ScaleLegend isService={displayComparaisonChart} />
		</StatsCard>
	)
}

/**
 * Échelle d'activité (emoji + libellé) affichée en pied de carte, sur toute la
 * largeur disponible et avec retour à la ligne — évite toute troncature.
 */
function ScaleLegend({ isService }: Readonly<{ isService: boolean }>) {
	return (
		<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-border bg-muted/30 px-4 py-3">
			{Object.entries(frenchAttendanceState).map(([key, value]) => (
				<span
					key={key}
					className="flex items-center gap-1.5 text-xs text-muted-foreground"
				>
					<span className="text-sm">
						{attendanceStateEmoji[key as AttendanceState]}
					</span>
					<span className="whitespace-nowrap">
						{isService
							? servicefrenchAttendanceState[key as AttendanceState]
							: value}
					</span>
				</span>
			))}
		</div>
	)
}
