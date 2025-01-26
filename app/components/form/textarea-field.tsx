import { type FieldMetadata, getTextareaProps } from '@conform-to/react'
import { cn } from '~/utils/ui'
import FieldError from './field-error'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'

interface FieldProps {
	field: FieldMetadata<string | number>
	withError?: boolean
	label?: string
	errorClassName?: string
	LabelProps?: React.ComponentProps<typeof Label>
	TextareaProps?: React.ComponentProps<typeof Textarea>
}

export default function TextAreaField({
	field,
	label,
	withError = true,
	LabelProps,
	TextareaProps,
	errorClassName,
}: Readonly<FieldProps>) {
	return (
		<div className="form-control w-full" hidden={TextareaProps?.hidden}>
			{label && (
				<Label
					{...LabelProps}
					className={cn(
						{ 'label-required': field.required },
						LabelProps?.className,
					)}
					htmlFor={field.id}
				>
					{label}
				</Label>
			)}
			<div className="mt-1">
				<Textarea
					{...getTextareaProps(field, { ariaAttributes: true })}
					{...TextareaProps}
				/>
				{withError && (
					<FieldError className={cn('text-xs', errorClassName)} field={field} />
				)}
			</div>
		</div>
	)
}
