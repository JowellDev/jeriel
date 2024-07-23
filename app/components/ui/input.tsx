import * as React from 'react'
import { cn } from '~/utils/ui'
import { cva, type VariantProps } from 'class-variance-authority'

const inputVariants = cva(
	'flex h-9 w-full rounded-md border border-zinc-200 bg-transparent text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300',
	{
		variants: {
			variant: {
				default: 'border-input px-4 py-6',
				search: 'border-input pl-7',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement>,
		VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, variant, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(inputVariants({ variant, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
Input.displayName = 'Input'

export { Input }
