import { getSelectProps, type FieldMetadata } from '@conform-to/react'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	type SelectProps,
} from '../ui/select'
import FieldError from './field-error'
import { Label } from '../ui/label'
import { cn } from '~/utils/ui'

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
	...props
}: Readonly<FieldProps>) {
	return (
		<div className="form-control">
			{label && (
				<Label htmlFor={field.id}>
					<span className={`${field.required && 'label-required'}`}>
						{label}
					</span>
				</Label>
			)}
			<div className="mt-1">
				<Select
					{...props}
					{...getSelectProps(field)}
					defaultValue={defaultValue ?? field?.value}
					onValueChange={onChange}
				>
					<SelectTrigger
						className={cn('w-full py-6 border-input', errorClassName)}
					>
						<SelectValue
							placeholder={placeholder ?? 'Sélectionner un élement'}
						/>
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
				<FieldError className={cn('text-sm', errorClassName)} field={field} />
			</div>
		</div>
	)
}
