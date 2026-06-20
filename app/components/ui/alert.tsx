import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/utils/ui'

const alertVariants = cva(
	'relative w-full rounded-lg border border-border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 ',
	{
		variants: {
			variant: {
				default: 'bg-card text-foreground ',
				info: 'bg-info/10 border-info/20 text-foreground [&>svg]:text-info',
				destructive:
					'border-destructive/50 text-destructive [&>svg]:text-destructive',
				success:
					'text-success [&>svg]:text-current *:data-[slot=alert-description]:text-success/80',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

const Alert = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
	<div
		ref={ref}
		role="alert"
		className={cn(alertVariants({ variant }), className)}
		{...props}
	/>
))
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h5
		ref={ref}
		className={cn('mb-1 font-medium leading-none tracking-tight', className)}
		{...props}
	/>
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn('text-sm [&_p]:leading-relaxed', className)}
		{...props}
	/>
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
