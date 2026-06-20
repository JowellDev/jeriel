import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/utils/ui'

const badgeVariants = cva(
	'inline-flex items-center rounded-xl border border-border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ',
	{
		variants: {
			variant: {
				default:
					'text-[10px] sm:text-sm border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/80 ',
				primary:
					'text-[10px] sm:text-sm border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
				secondary:
					'text-[10px] sm:text-sm border-transparent bg-muted text-muted-foreground hover:bg-muted/80',
				destructive:
					'text-[10px] sm:text-sm border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/80',
				outline: 'text-[11px] sm:text-sm text-foreground ',
				success:
					'text-[10px] sm:text-sm border-transparent bg-success/15 text-success hover:bg-success/25',
				'chart-legend':
					'text-[6px] sm:text-[10px] px-2 border-transparent bg-muted text-muted-foreground hover:bg-muted/80',
				mobile:
					'px-1 border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/80 ',
				warning:
					'text-[10px] sm:text-sm border-transparent bg-warning/20 text-warning-foreground hover:bg-warning/30',
				'dark-success':
					'text-[10px] sm:text-sm border-transparent bg-success text-success-foreground shadow-sm hover:bg-success/80',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

export interface BadgeProps
	extends
		React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	)
}

export { Badge, badgeVariants }
