import * as React from 'react'
import { endOfMonth, startOfMonth, format } from 'date-fns'
import { CalendarIcon } from '@radix-ui/react-icons'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import type { DateRange } from 'react-day-picker'
import { cn } from '~/utils/ui'
import { Input } from '../ui/input'
import { fr } from 'date-fns/locale'

const currentDate = new Date()

export function MonthPicker({
	onValueChange,
	defaultValue,
	className,
	defaultMonth = currentDate,
}: Readonly<{
	defaultValue?: { from?: string; to?: string }
	onValueChange: (value?: DateRange) => void
	className?: string
	defaultMonth?: Date
}>) {
	const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
	const defaultLabel = format(defaultMonth, 'MMMM yyyy', { locale: fr })

	React.useEffect(() => {
		if (!defaultValue?.from) {
			setDateRange(undefined)
		}
	}, [defaultValue?.from])

	function handleOnChange(e: React.ChangeEvent<HTMLInputElement>) {
		const { value } = e.target
		const selectedDate = value ? new Date(value) : new Date()
		const from = startOfMonth(selectedDate)

		const dateRange = { from, to: endOfMonth(from) }

		setDateRange(dateRange)
		onValueChange(dateRange)
	}

	function getDefaultMonth() {
		return dateRange?.from
			? format(dateRange.from, 'yyyy-MM', { locale: fr })
			: format(defaultMonth, 'yyyy-MM', { locale: fr })
	}

	function getMaxMonth() {
		return format(endOfMonth(currentDate), 'yyyy-MM', { locale: fr })
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={'outline'}
					className={cn(
						'flex justify-start text-left font-normal space-x-2 border-input',
						!dateRange && 'text-muted-foreground',
						className,
					)}
				>
					<span className="capitalize">
						{dateRange?.from
							? format(dateRange.from, 'MMMM yyyy', { locale: fr })
							: defaultLabel}
					</span>
					<CalendarIcon />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<Input
					type="month"
					className="w-full border-none capitalize"
					onChange={handleOnChange}
					defaultValue={getDefaultMonth()}
					max={getMaxMonth()}
					min={'2024-01'}
				/>
			</PopoverContent>
		</Popover>
	)
}
