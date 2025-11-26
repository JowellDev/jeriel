import { type FieldMetadata, getTextareaProps } from '@conform-to/react'

import { cn } from '~/utils/ui'

import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import FieldError from './field-error'

interface FieldProps {
	field: FieldMetadata<string | number>
	withError?: boolean
	label?: string
	errorClassName?: string
	labelProps?: React.ComponentProps<typeof Label>
	textareaProps?: React.ComponentProps<typeof Textarea>
}

export default function TextAreaField({
	field,
	label,
	labelProps,
	textareaProps,
	errorClassName,
	withError = true,
}: Readonly<FieldProps>) {
	return (
		<div className="form-control w-full" hidden={textareaProps?.hidden}>
			{label && (
				<Label
					{...labelProps}
					className={cn(
						{ 'label-required': field.required },
						textareaProps?.className,
					)}
					htmlFor={field.id}
				>
					{label}
				</Label>
			)}
			<div className="mt-1">
				<Textarea
					{...getTextareaProps(field, { ariaAttributes: true })}
					{...textareaProps}
				/>
				{withError && (
					<FieldError className={cn('text-xs', errorClassName)} field={field} />
				)}
			</div>
		</div>
	)
}
