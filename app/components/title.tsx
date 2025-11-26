import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '~/utils/ui'

const titleVariants = cva('inline-block capitalize', {
	variants: {
		tag: {
			h1: 'h1',
			h2: 'h2',
			h3: 'h3',
			h4: 'h4',
			h5: 'h5',
			h6: 'h6',
		},
	},
	defaultVariants: {
		tag: 'h1',
	},
})

export interface TitleProps
	extends HTMLAttributes<HTMLHeadingElement>,
		VariantProps<typeof titleVariants> {
	underlined?: boolean
}

const Title = forwardRef<HTMLHeadingElement, Readonly<TitleProps>>(
	({ className, tag, underlined, ...props }, ref) => {
		const Comp = !tag ? 'h1' : tag
		const underlinedClass = `before:content-[''] before:absolute before:-bottom-2 before:left-0 before:w-1/3 before:border before:border-zinc-500 relative`

		return (
			<Comp
				className={cn(
					titleVariants({ tag, className }),
					underlined && underlinedClass,
				)}
				ref={ref}
				{...props}
			/>
		)
	},
)

Title.displayName = 'Title'

export { Title, titleVariants }
