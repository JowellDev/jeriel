import { getInputProps, type FieldMetadata } from '@conform-to/react'
import { cn } from '~/utils/ui'
import FieldError from './field-error'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface FieldProps {
	field: FieldMetadata<string | number | Date | File>
	withError?: boolean
	label?: string
	type?: Parameters<typeof getInputProps>[1]['type']
	errorClassName?: string
	labelProps?: React.ComponentProps<typeof Label>
	inputProps?: React.ComponentProps<typeof Input>
}

export default function InputField({
	field,
	label,
	type = 'text',
	withError = true,
	labelProps,
	inputProps,
	errorClassName,
}: Readonly<FieldProps>) {
	const { key: inputKey, ...restInputProps } = inputProps ?? {}

	return (
		<div className="form-control w-full" hidden={inputProps?.hidden}>
			{label && (
				<Label
					{...labelProps}
					className={cn(
						{ 'label-required': field.required },
						labelProps?.className,
					)}
					htmlFor={field.id}
				>
					{label}
				</Label>
			)}
			<div className="mt-1">
				<Input
					{...getInputProps(field, { type, ariaAttributes: true })}
					{...restInputProps}
				/>
				{withError && (
					<FieldError className={cn('text-xs', errorClassName)} field={field} />
				)}
			</div>
		</div>
	)
}
