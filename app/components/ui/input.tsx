import * as React from 'react'
import { cn } from '~/utils/ui'
import { cva, type VariantProps } from 'class-variance-authority'

const inputVariants = cva(
	'flex h-11 w-full rounded-md border border-input bg-background text-sm shadow-sm transition-[color,box-shadow,border-color] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/30 disabled:cursor-not-allowed disabled:opacity-50 ',
	{
		variants: {
			variant: {
				default: 'px-3.5 py-2',
				search: 'pl-4',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

export interface InputProps
	extends
		React.InputHTMLAttributes<HTMLInputElement>,
		VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, variant, ...props }, ref) => {
		const isFile = type === 'file'

		const fileClassName = cn(
			'border-input p-2 border-input rounded-md block w-full text-sm text-muted-foreground file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:bg-muted file:text-sm file:font-semibold file:text-foreground hover:file:bg-accent ',
			className,
		)

		return (
			<input
				type={type}
				className={cn(
					isFile ? fileClassName : inputVariants({ variant, className }),
				)}
				ref={ref}
				{...props}
			/>
		)
	},
)
Input.displayName = 'Input'

export { Input }
