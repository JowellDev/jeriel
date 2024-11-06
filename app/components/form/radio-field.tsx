import { type FieldMetadata } from '@conform-to/react'
import { cn } from '~/utils/ui'
import FieldError from './field-error'
import { Label } from '../ui/label'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'

interface FieldProps {
	field: FieldMetadata<string | number>
	withError?: boolean
	label?: string
	errorClassName?: string
	LabelProps?: React.ComponentProps<typeof Label>
	options: Array<{ value: string; label: string }>
	onValueChange?: ((value: string) => void) | undefined
	inline?: boolean
	isDisabled?: boolean
}

export default function Input({
	field,
	label,
	withError = true,
	inline = true,
	LabelProps,
	errorClassName,
	options,
	isDisabled,
	onValueChange,
}: Readonly<FieldProps>) {
	return (
		<div className="form-control w-full">
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
				<RadioGroup
					defaultValue={field.value}
					onValueChange={onValueChange}
					className={cn(inline && 'flex flex-wrap gap-x-4')}
					disabled={isDisabled}
				>
					{options.map(({ value, label }) => {
						return (
							<div className="flex items-center space-x-2" key={value}>
								<RadioGroupItem value={value} id={`${field.id}-${value}`} />
								<Label
									htmlFor={`${field.id}-${value}`}
									className="cursor-pointer"
								>
									{label}
								</Label>
							</div>
						)
					})}
				</RadioGroup>
				{withError && (
					<FieldError className={cn('text-xs', errorClassName)} field={field} />
				)}
			</div>
		</div>
	)
}
