import { useEffect, useState } from 'react'
import { type FieldMetadata } from '@conform-to/react'

import { cn } from '~/utils/ui'

import { Label } from '../ui/label'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import FieldError from './field-error'

interface FieldProps {
	field: FieldMetadata<string | number>
	withError?: boolean
	label?: string
	errorClassName?: string
	labelProps?: React.ComponentProps<typeof Label>
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
	labelProps,
	errorClassName,
	options,
	isDisabled,
	onValueChange,
}: Readonly<FieldProps>) {
	// État local optimiste : le radio réagit dès le 1er clic, sans attendre le
	// render suivant de conform (form.update). On reste synchronisé si la valeur
	// du champ change par ailleurs (ex. sélection de membres).
	const [value, setValue] = useState<string | undefined>(
		field.value as string | undefined,
	)

	useEffect(() => {
		setValue(field.value as string | undefined)
	}, [field.value])

	function handleValueChange(next: string) {
		setValue(next)
		onValueChange?.(next)
	}

	return (
		<div className="form-control w-full">
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
				<RadioGroup
					value={value}
					onValueChange={handleValueChange}
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
