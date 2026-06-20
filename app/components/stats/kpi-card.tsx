import { Link } from '@remix-run/react'
import {
	RiArrowDownLine,
	RiArrowUpLine,
	type RemixiconComponentType,
} from '@remixicon/react'

import { Card } from '~/components/ui/card'
import { cn } from '~/utils/ui'

export type KpiTrend = {
	label: string
	direction: 'up' | 'down' | 'neutral'
}

type Props = {
	label: string
	value: number | string
	Icon: RemixiconComponentType
	hint?: string
	trend?: KpiTrend
	to?: string
	className?: string
}

export function KpiCard({
	label,
	value,
	Icon,
	hint,
	trend,
	to,
	className,
}: Readonly<Props>) {
	const content = (
		<>
			<span className="absolute inset-y-0 left-0 w-1 bg-primary/70" />
			<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary transition-transform group-hover:scale-105">
				<Icon size={26} />
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium text-muted-foreground">
					{label}
				</p>
				<p className="text-3xl font-extrabold leading-tight text-foreground">
					{value}
				</p>
				{trend ? (
					<TrendBadge trend={trend} />
				) : (
					hint && (
						<p className="truncate text-xs text-muted-foreground">{hint}</p>
					)
				)}
			</div>
		</>
	)

	const base = cn(
		'group relative flex items-center gap-4 overflow-hidden p-4 transition-all hover:-translate-y-0.5 hover:shadow-md',
		className,
	)

	if (to) {
		return (
			<Link to={to} className="block">
				<Card className={base}>{content}</Card>
			</Link>
		)
	}

	return <Card className={base}>{content}</Card>
}

function TrendBadge({ trend }: Readonly<{ trend: KpiTrend }>) {
	const color =
		trend.direction === 'up'
			? 'text-success'
			: trend.direction === 'down'
				? 'text-destructive'
				: 'text-muted-foreground'

	const Icon =
		trend.direction === 'up'
			? RiArrowUpLine
			: trend.direction === 'down'
				? RiArrowDownLine
				: null

	return (
		<p
			className={cn(
				'mt-0.5 flex items-center gap-0.5 text-xs font-medium',
				color,
			)}
		>
			{Icon && <Icon size={14} />}
			<span className="truncate">{trend.label}</span>
		</p>
	)
}
