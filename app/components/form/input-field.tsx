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
	errorClassName?: string
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
	errorClassName,
}: Readonly<FieldProps>) {
	const conformProps = getInputProps(field, { type, ariaAttributes: true })

	const { key: conformKey, ...restConformProps } = conformProps
	const { key: inputKey, ...restInputProps } = InputProps ?? {}

	const finalKey = inputKey ?? conformKey

	return (
		<div className="form-control w-full" hidden={InputProps?.hidden}>
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
				<Input key={finalKey} {...restConformProps} {...restInputProps} />
				{withError && (
					<FieldError className={cn('text-xs', errorClassName)} field={field} />
				)}
			</div>
		</div>
	)
}
