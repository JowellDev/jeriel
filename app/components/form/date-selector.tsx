import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

import { format, startOfMonth, endOfMonth } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '~/utils/ui'

interface MonthPickerProps {
	className?: string
	defaultMonth?: Date
	onChange: (value: { from: Date; to: Date }) => void
}

const currentDate = new Date()

const DateSelector = ({
	className,
	defaultMonth = currentDate,
	onChange,
}: MonthPickerProps) => {
	const [yearRange, setYearRange] = useState(() => {
		const currentYear = defaultMonth.getFullYear()
		return {
			start: currentYear - 2,
			end: currentYear + 2,
		}
	})

	const [selectedDate, setSelectedDate] = useState(defaultMonth)
	const [isOpen, setIsOpen] = useState(false)
	const [view, setView] = useState('years')

	const handleDateChange = (year: number, month: number) => {
		const newDate = new Date(year, month)
		const from = startOfMonth(newDate)
		const to = endOfMonth(from)

		setSelectedDate(newDate)
		onChange({ from, to })
	}

	const generateYearGrid = () => {
		const years = []
		for (let year = yearRange.start; year <= yearRange.end; year += 4) {
			const row = []
			for (let i = 0; i < 4 && year + i <= yearRange.end; i++) {
				row.push(year + i)
			}
			years.push(row)
		}
		return years
	}

	const navigateYearRange = (direction: number) => {
		const increment = 4
		setYearRange(prev => ({
			start: prev.start + direction * increment,
			end: prev.end + direction * increment,
		}))
	}

	const handleYearClick = (year: number) => {
		setSelectedDate(new Date(year, selectedDate.getMonth()))
		setView('months')
	}

	const handleMonthClick = (monthIndex: number) => {
		handleDateChange(selectedDate.getFullYear(), monthIndex)
		setIsOpen(false)
		setView('years')
	}

	const handlePopoverClose = (open: boolean) => {
		setIsOpen(open)
		if (!open) {
			setView('years')
		}
	}

	const maxDate = endOfMonth(currentDate)
	const minDate = new Date(2024, 0)

	const isDateDisabled = (year: number, month?: number) => {
		if (month === undefined) {
			return year > maxDate.getFullYear() || year < minDate.getFullYear()
		}
		const date = new Date(year, month)
		return date > maxDate || date < minDate
	}

	const formatDisplayDate = (date: Date) => {
		return format(date, 'MMMM yyyy', { locale: fr })
	}

	return (
		<Popover open={isOpen} onOpenChange={handlePopoverClose}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						'min-w-[180px] flex items-center justify-between border-input font-normal capitalize',
						className,
					)}
				>
					{formatDisplayDate(selectedDate)}
					<Calendar className="ml-2 h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="center">
				{view === 'years' ? (
					<div className="p-3 min-w-[280px]">
						<div className="flex justify-between items-center mb-2">
							<button
								onClick={() => navigateYearRange(-1)}
								className="p-1 hover:bg-gray-100 rounded"
								disabled={yearRange.start <= minDate.getFullYear()}
							>
								<ChevronLeft className="w-4 h-4" />
							</button>
							<span className="text-sm font-medium">
								{yearRange.start} - {yearRange.end}
							</span>
							<button
								onClick={() => navigateYearRange(1)}
								className="p-1 hover:bg-gray-100 rounded"
								disabled={yearRange.start >= maxDate.getFullYear()}
							>
								<ChevronRight className="w-4 h-4" />
							</button>
						</div>
						<div className="grid grid-cols-4 gap-1">
							{generateYearGrid().map((row, rowIndex) => (
								<React.Fragment key={rowIndex}>
									{row.map(year => (
										<button
											key={year}
											onClick={() => handleYearClick(year)}
											disabled={isDateDisabled(year)}
											className={cn(
												'p-2 text-sm rounded',
												selectedDate.getFullYear() === year
													? 'bg-[#226C67] text-white'
													: 'hover:bg-gray-100',
												isDateDisabled(year) && 'opacity-50',
											)}
										>
											{year}
										</button>
									))}
								</React.Fragment>
							))}
						</div>
					</div>
				) : (
					<div className="p-3 min-w-[280px]">
						<div className="flex justify-between items-center mb-2">
							<button
								onClick={() => setView('years')}
								className="p-1 hover:bg-gray-100 rounded flex items-center"
							>
								<ChevronLeft className="w-4 h-4 mr-1" />
								<span className="text-sm font-medium">
									{selectedDate.getFullYear()}
								</span>
							</button>
						</div>
						<div className="grid grid-cols-2 gap-1">
							{Array.from({ length: 12 }, (_, i) => i).map(month => {
								const isDisabled = isDateDisabled(
									selectedDate.getFullYear(),
									month,
								)
								return (
									<button
										key={month}
										onClick={() => handleMonthClick(month)}
										disabled={isDisabled}
										className={cn(
											'px-3 py-2 text-sm text-left rounded',
											selectedDate.getMonth() === month
												? 'bg-[#226C67] text-white'
												: 'hover:bg-gray-100',
											isDisabled && 'opacity-50',
										)}
									>
										{format(new Date(2024, month), 'MMMM', { locale: fr })}
									</button>
								)
							})}
						</div>
					</div>
				)}
			</PopoverContent>
		</Popover>
	)
}

export default DateSelector
