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
				'flex items-center gap-4 p-4 transition-shadow hover:shadow-md',
				className,
			)}
		>
			<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
				<Icon size={24} />
			</div>
			<div className="min-w-0">
				<p className="truncate text-sm text-muted-foreground">{label}</p>
				<p className="text-2xl font-bold leading-tight text-foreground">
					{value}
				</p>
				{hint && <p className="text-xs text-muted-foreground">{hint}</p>}
			</div>
		</Card>
	)
}
