import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from '@radix-ui/react-icons'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import type { DateRange } from 'react-day-picker'
import { cn } from '~/utils/ui'
import { RiCloseFill } from '@remixicon/react'

export function DateRangePicker({
	onValueChange,
	defaultValue,
	className,
	defaultLabel = 'Période',
}: Readonly<{
	defaultValue?: { from?: string; to?: string }
	onValueChange: (value?: DateRange) => void
	className?: string
	defaultLabel?: string
}>) {
	const [dateRange, setDateRange] = React.useState<DateRange | undefined>()

	React.useEffect(() => {
		if (!defaultValue?.from) {
			setDateRange(undefined)
		}
	}, [defaultValue?.from])

	function onSelect(range?: DateRange) {
		setDateRange(range)
		onValueChange(range)
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={'outline'}
					className={cn(
						'flex justify-between items-center text-left font-normal space-x-2 border-input',
						!dateRange && 'text-muted-foreground',
						className,
					)}
				>
					<span>
						{dateRange?.from && dateRange.to
							? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(
									dateRange.to,
									'dd/MM/yyyy',
								)}`
							: defaultLabel}
					</span>
					<span className="flex items-center">
						<CalendarIcon />
						{dateRange && (
							<RiCloseFill
								onClick={ev => {
									setDateRange(undefined)
									ev.stopPropagation()
								}}
								className="hover:scale-150 transition duration-125 ease-in-out hover:text-[#f50000] -mr-2"
							></RiCloseFill>
						)}
					</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<Calendar
					mode="range"
					selected={dateRange}
					onSelect={range => onSelect(range)}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	)
}
