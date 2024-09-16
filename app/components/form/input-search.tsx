import React from 'react'
import { RiSearch2Line } from '@remixicon/react'
import { Input } from '../ui/input'
import { cn } from '~/utils/ui'

interface InputSearchProps {
	defaultValue?: string
	placeholder?: string
	onSearch: (query: string) => void
	className?: string
}

export function InputSearch({
	defaultValue = '',
	placeholder = '',
	className,
	onSearch,
}: InputSearchProps) {
	const [value, setValue] = React.useState(defaultValue)

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = event.target.value
		setValue(newValue)
		onSearch(newValue)
	}

	return (
		<div className="relative">
			<Input
				placeholder={placeholder}
				className={cn('w-full pr-8', className)}
				variant="search"
				value={value}
				onChange={handleChange}
			/>
			<RiSearch2Line className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
		</div>
	)
}
