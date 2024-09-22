import * as React from 'react'
import { endOfMonth, startOfMonth, format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { cn } from '~/utils/ui'
import { Input } from '../ui/input'
import { fr } from 'date-fns/locale'

const currentDate = new Date()

export function MonthPicker({
	className,
	defaultMonth = currentDate,
	onChange,
}: Readonly<{
	className?: string
	defaultMonth?: Date
	onChange: (value: DateRange) => void
}>) {
	function handleOnChange(e: React.ChangeEvent<HTMLInputElement>) {
		const { value } = e.target
		const selectedDate = value ? new Date(value) : new Date()
		const from = startOfMonth(selectedDate)

		onChange({ from, to: endOfMonth(from) })
	}

	return (
		<Input
			type="month"
			className={cn('w-full capitalize border-input py-1', className)}
			onChange={handleOnChange}
			defaultValue={format(defaultMonth, 'yyyy-MM', { locale: fr })}
			max={format(endOfMonth(currentDate), 'yyyy-MM', { locale: fr })}
			min="2024-01"
		/>
	)
}
