import { type ReactNode } from 'react'
import { type RemixiconComponentType } from '@remixicon/react'
import { Card } from '~/components/ui/card'
import { cn } from '~/utils/ui'

interface SectionCardProps {
	title: string
	description?: string
	Icon?: RemixiconComponentType
	action?: ReactNode
	className?: string
	children: ReactNode
}

/** Carte de section homogène pour les blocs analytiques. */
export function SectionCard({
	title,
	description,
	Icon,
	action,
	className,
	children,
}: Readonly<SectionCardProps>) {
	return (
		<Card className={cn('flex flex-col p-4', className)}>
			<div className="mb-3 flex items-start justify-between gap-2">
				<div className="flex items-center gap-2">
					{Icon && (
						<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<Icon size={18} />
						</span>
					)}
					<div>
						<h3 className="text-sm font-semibold text-foreground">{title}</h3>
						{description && (
							<p className="text-xs text-muted-foreground">{description}</p>
						)}
					</div>
				</div>
				{action}
			</div>
			<div className="flex-1">{children}</div>
		</Card>
	)
}

interface EmptyStateProps {
	message: string
}

export function EmptyState({ message }: Readonly<EmptyStateProps>) {
	return (
		<div className="flex h-full min-h-24 items-center justify-center rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
			{message}
		</div>
	)
}
