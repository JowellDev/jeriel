import { type RemixiconComponentType } from '@remixicon/react'

import { Card } from '~/components/ui/card'
import { cn } from '~/utils/ui'

type Props = {
	label: string
	value: number | string
	Icon: RemixiconComponentType
	hint?: string
	className?: string
}

export function KpiCard({
	label,
	value,
	Icon,
	hint,
	className,
}: Readonly<Props>) {
	return (
		<Card
			className={cn(
				'group relative flex items-center gap-4 overflow-hidden p-4 transition-all hover:-translate-y-0.5 hover:shadow-md',
				className,
			)}
		>
			<span className="absolute inset-y-0 left-0 w-1 bg-primary/70" />
			<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary transition-transform group-hover:scale-105">
				<Icon size={26} />
			</div>
			<div className="min-w-0">
				<p className="truncate text-sm font-medium text-muted-foreground">
					{label}
				</p>
				<p className="text-3xl font-extrabold leading-tight text-foreground">
					{value}
				</p>
				{hint && (
					<p className="truncate text-xs text-muted-foreground">{hint}</p>
				)}
			</div>
		</Card>
	)
}
