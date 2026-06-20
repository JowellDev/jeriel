import type { FieldMetadata } from '@conform-to/react'
import type { ComponentPropsWithoutRef } from 'react'
import { RiErrorWarningLine } from '@remixicon/react'

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
			className={cn(
				'flex items-center gap-1 pt-1 text-xs font-medium text-destructive',
				className,
			)}
			id={field.errorId}
		>
			<RiErrorWarningLine className="h-3.5 w-3.5 shrink-0" />
			<span>{errors?.[0]}</span>
		</p>
	)
}
