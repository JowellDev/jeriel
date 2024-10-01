import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '~/utils/ui'

const badgeVariants = cva(
	'inline-flex items-center rounded-xl border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 dark:border-zinc-800 dark:focus:ring-zinc-300',
	{
		variants: {
			variant: {
				default:
					'text-[10px] sm:text-sm border-transparent bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/80 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/80',
				primary:
					'text-[10px] sm:text-sm bg-[#226C67] text-white shadow hover:bg-[#226C67]/90 dark:bg-[#226C67]-50 dark:text-white dark:hover:bg-[#226C67]-50/90',
				secondary:
					'text-[10px] sm:text-sm border-transparent bg-neutral-200 text-zinc-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-zinc-50 dark:hover:bg-neutral-800/80',
				destructive:
					'text-[10px] sm:text-sm border-transparent bg-red-500 text-zinc-50 shadow hover:bg-red-500/80 dark:bg-red-900 dark:text-zinc-50 dark:hover:bg-red-900/80',
				outline: 'text-[11px] sm:text-sm text-zinc-950 dark:text-zinc-50',
				success:
					'text-[10px] sm:text-sm border-transparent bg-emerald-200 text-emerald-600 shadow hover:bg-emerald-500/80 dark:bg-emerald-900 dark:text-zinc-50 dark:hover:bg-emerald-900/80',
				'chart-legend':
					'text-[8px] sm:text-[11px] border-transparent bg-neutral-200 text-zinc-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-zinc-50 dark:hover:bg-neutral-800/80',
				mobile:
					'px-1 border-transparent bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/80 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/80',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	)
}

export { Badge, badgeVariants }
