import type { FieldMetadata } from '@conform-to/react'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '~/utils/ui'

interface Props extends ComponentPropsWithoutRef<'p'> {
	field: FieldMetadata<string | number | null | string[] | Date | File>
	className?: string
}

export default function FieldError({
	field,
	className,
	...props
}: Readonly<Props>) {
	const errors = field.errors

	if (!errors) return null

	return (
		<p
			{...props}
			className={cn('pt-1 text-xs text-red-500', className)}
			id={field.errorId}
		>
			{errors?.[0]}
		</p>
	)
}
