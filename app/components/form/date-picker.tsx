import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from '@radix-ui/react-icons'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import type { DateRange } from 'react-day-picker'
import { cn } from '~/utils/ui'
import { RiCloseFill } from '@remixicon/react'

interface Props {
	className?: string
	defaultLabel?: string
	onValueChange: (value?: DateRange) => void
	onResetDate?: () => void
	defaultValue?: { from?: string; to?: string }
}

export function DateRangePicker({
	onValueChange,
	defaultValue,
	className,
	onResetDate,
	defaultLabel = 'Période',
}: Readonly<Props>) {
	const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
		defaultValue?.from && defaultValue?.to
			? {
					from: new Date(defaultValue?.from),
					to: new Date(defaultValue?.to),
				}
			: undefined,
	)

	function onSelect(range?: DateRange) {
		setDateRange(range)
		onValueChange(range)
	}

	function handleResetDate(ev: React.MouseEvent<SVGSVGElement, MouseEvent>) {
		onResetDate?.()

		setDateRange(undefined)
		ev.stopPropagation()
	}

	React.useEffect(() => {
		if (!defaultValue?.from) {
			setDateRange(undefined)
		}
	}, [defaultValue?.from])

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
								onClick={handleResetDate}
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
