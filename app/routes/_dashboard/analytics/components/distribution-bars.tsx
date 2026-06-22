import type { DistributionItem } from '../types'
import { EmptyState } from './section-card'

interface DistributionBarsProps {
	items: DistributionItem[]
	emptyMessage?: string
	/** Couleur Tailwind du remplissage (ex: bg-primary). */
	barClassName?: string
}

/** Barres horizontales proportionnelles pour une répartition. */
export function DistributionBars({
	items,
	emptyMessage = 'Aucune donnée disponible',
	barClassName = 'bg-primary',
}: Readonly<DistributionBarsProps>) {
	if (items.length === 0) return <EmptyState message={emptyMessage} />

	const total = items.reduce((sum, item) => sum + item.value, 0)

	return (
		<ul className="space-y-2.5">
			{items.map(item => {
				const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
				return (
					<li key={item.label} className="space-y-1">
						<div className="flex items-center justify-between text-xs">
							<span className="font-medium text-foreground">{item.label}</span>
							<span className="text-muted-foreground">
								{item.value} · {pct}%
							</span>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className={`h-full rounded-full ${barClassName}`}
								style={{ width: `${pct}%` }}
							/>
						</div>
					</li>
				)
			})}
		</ul>
	)
}
