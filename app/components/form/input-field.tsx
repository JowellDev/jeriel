import { getInputProps, type FieldMetadata } from '@conform-to/react'
import { cn } from '~/utils/ui'
import FieldError from './field-error'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface FieldProps {
	field: FieldMetadata<string | number>
	withError?: boolean
	label?: string
	type?: Parameters<typeof getInputProps>[1]['type']
	ErrorClassName?: string
	LabelProps?: React.ComponentProps<typeof Label>
	InputProps?: React.ComponentProps<typeof Input>
}

export default function InputField({
	field,
	label,
	type = 'text',
	withError = true,
	LabelProps,
	InputProps,
	ErrorClassName,
}: Readonly<FieldProps>) {
	return (
		<div className="form-control" hidden={InputProps?.hidden}>
			{label && (
				<Label {...LabelProps} htmlFor={field.id}>
					{label}
				</Label>
			)}
			<div className="mt-1">
				<Input
					{...getInputProps(field, { type, ariaAttributes: true })}
					{...InputProps}
				/>
				{withError && (
					<FieldError className={cn('text-sm', ErrorClassName)} field={field} />
				)}
			</div>
		</div>
	)
}
