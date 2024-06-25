import type { FieldConfig } from '@conform-to/react'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '~/utils/ui'

interface Props<T> extends ComponentPropsWithoutRef<'p'> {
	field: FieldConfig<T>
}

export default function FieldError<T>({
	field,
	className,
	...props
}: Readonly<Props<T>>) {
	if (!field.error) return null

	return (
		<p
			{...props}
			className={cn('pt-1 text-xs text-red-500', className)}
			id={field.errorId}
		>
			{field.error}
		</p>
	)
}
