import { type FieldMetadata, getSelectProps } from '@conform-to/react'
import type * as SelectPrimitive from '@radix-ui/react-select'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '../ui/select'

interface SelectInputProps extends SelectPrimitive.SelectProps {
	placeholder?: string
	testId?: string
	items: { label: string | number; value?: string | number }[]
	field?: FieldMetadata<string | null>
	defaultValue?: string
	onChange?: (value: string) => void
	size?: 'lg' | 'md'
	label?: string
	className?: string
}

export function SelectInput({
	items,
	field,
	onChange,
	placeholder,
	defaultValue,
	size,
	testId,
	label,
	className,
	...props
}: Readonly<SelectInputProps>) {
	const error = field?.errors?.[0]
	return (
		<Select
			{...props}
			{...(field && getSelectProps(field))}
			onValueChange={onChange}
			data-testid={testId ? `select-${testId}` : 'select'}
			defaultValue={defaultValue ?? field?.value}
		>
			<SelectTrigger
				className={`${size === 'md' && 'py-0'} ${className ?? ''}`}
			>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent className="w-max border-none">
				<SelectGroup className="py-0">
					<SelectLabel className={`${!label && 'hidden'}`}>{label}</SelectLabel>
					{items.map(({ value, label }, index) => (
						<SelectItem
							key={`${value}@${index}`}
							data-testid={`select-option-${label}`}
							value={`${value}`}
							className="cursor-pointer focus:bg-[#005CA8]"
						>
							{label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
			{error && <div className="mt-1 text-sm text-red-500">{error}</div>}
		</Select>
	)
}
