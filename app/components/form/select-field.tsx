import { getSelectProps, type FieldMetadata } from '@conform-to/react'

import { cn } from '~/utils/ui'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	type SelectProps,
} from '../ui/select'
import { Label } from '../ui/label'
import { Hint } from '../hint'
import FieldError from './field-error'

interface FieldProps extends SelectProps {
	field: FieldMetadata<string | null>
	label?: string
	items: { label: string; value: string; color?: string }[]
	onChange?: (value: string) => void
	className?: string
	withColor?: boolean
	contentClassName?: string
	defaultValue?: string
	placeholder?: string
	errorClassName?: string
	hintMessage?: string
}

export function SelectField({
	field,
	label,
	defaultValue,
	items,
	onChange,
	className = '',
	withColor = false,
	contentClassName = '',
	errorClassName = '',
	placeholder,
	hintMessage,
	disabled,
	...props
}: Readonly<FieldProps>) {
	const { key, ...rest } = getSelectProps(field)

	return (
		<div className="form-control w-full">
			{label && (
				<Label htmlFor={field.id}>
					<span className={`${field.required && 'label-required'}`}>
						{label}
					</span>
					{hintMessage && <Hint message={hintMessage} />}
				</Label>
			)}
			<Select
				{...props}
				{...rest}
				key={key}
				defaultValue={defaultValue ?? field?.value}
				onValueChange={onChange}
			>
				<SelectTrigger
					className={cn('w-full px-4 py-6 border-input', errorClassName)}
					disabled={disabled}
				>
					<SelectValue placeholder={placeholder ?? 'Sélectionner un élement'} />
				</SelectTrigger>
				<SelectContent className={contentClassName}>
					{items.map(({ value, label }, index) => (
						<SelectItem
							key={`${value}@${index}`}
							value={`${value}`}
							className="cursor-pointer"
						>
							{label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<FieldError className={cn('text-xs', errorClassName)} field={field} />
		</div>
	)
}
