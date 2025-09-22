import * as React from 'react'
import { cn } from '~/utils/ui'
import { cva, type VariantProps } from 'class-variance-authority'

const inputVariants = cva(
	'flex h-9 w-full rounded-md border border-zinc-200 bg-transparent text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300',
	{
		variants: {
			variant: {
				default:
					'border-input px-4 py-6 flex flex-col justify-center file:text-sm',
				search: 'border-input pl-4',
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
		const isFile = type === 'file'

		const fileClassName = cn(
			'border-input p-2 border-input rounded-md block w-full text-sm text-zinc-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:bg-zinc-100 file:text-sm file:font-semibold file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300 dark:hover:file:bg-zinc-700',
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
