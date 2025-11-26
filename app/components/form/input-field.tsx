import { getInputProps, type FieldMetadata } from '@conform-to/react'

import { cn } from '~/utils/ui'

import { Input } from '../ui/input'
import { Label } from '../ui/label'
import FieldError from './field-error'

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

	const { key, ...conformProps } = getInputProps(field, {
		type,
		ariaAttributes: true,
	})

	return (
		<div className="form-control w-full" hidden={inputProps?.hidden}>
			{label && (
				<Label
					{...labelProps}
					htmlFor={field.id}
					className={cn(
						{ 'label-required': field.required },
						labelProps?.className,
					)}
				>
					{label}
				</Label>
			)}
			<Input {...conformProps} {...restInputProps} key={key} />
			{withError && (
				<FieldError className={cn('text-xs', errorClassName)} field={field} />
			)}
		</div>
	)
}
