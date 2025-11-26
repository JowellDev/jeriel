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
	items: { label: string | number; value?: string | number }[]
	onChange?: (value: string) => void
}

export function SelectInput({
	items,
	placeholder,
	defaultValue,
	onChange,
	...props
}: Readonly<SelectInputProps>) {
	return (
		<Select onValueChange={onChange} {...props} defaultValue={defaultValue}>
			<SelectTrigger className="border-input">
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					{placeholder && <SelectLabel>{placeholder}</SelectLabel>}
					{items.map(({ value, label }, index) => (
						<SelectItem
							key={`${value}@@@${index}`}
							value={`${value}`}
							className="hover:cursor-pointer"
						>
							{label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	)
}
