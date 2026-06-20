import { cn } from '~/utils/ui'

function Skeleton({
	className,
	...props
}: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
	return (
		<div
			className={cn('animate-pulse rounded-md bg-foreground/10 ', className)}
			{...props}
		/>
	)
}

export { Skeleton }
