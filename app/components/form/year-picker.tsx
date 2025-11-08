import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '~/utils/ui'
import { Label } from '../ui/label'

interface YearPickerProps {
	className?: string
	defaultYear?: Date
	label?: string
	isDesktop?: boolean
	minYear?: number
	maxYear?: number
	onChange: (value: Date) => void
}

const currentDate = new Date()

const YearPicker = ({
	className,
	defaultYear = currentDate,
	label,
	isDesktop,
	minYear = currentDate.getFullYear() - 5,
	maxYear = currentDate.getFullYear(),
	onChange,
}: YearPickerProps) => {
	const [yearRange, setYearRange] = useState(() => {
		const currentYear = defaultYear.getFullYear()
		return {
			start: Math.floor(currentYear / 5) * 5 - 5,
			end: Math.floor(currentYear / 5) * 5 + 9,
		}
	})

	const [selectedDate, setSelectedDate] = useState(defaultYear)
	const [isOpen, setIsOpen] = useState(false)

	const handleYearClick = (year: number) => {
		const newDate = new Date(year, 0, 1)
		setSelectedDate(newDate)
		onChange(newDate)
		setIsOpen(false)
	}

	const navigateYearRange = (direction: number) => {
		const increment = 15
		setYearRange(prev => ({
			start: prev.start + direction * increment,
			end: prev.end + direction * increment,
		}))
	}

	const handlePopoverClose = (open: boolean) => {
		setIsOpen(open)
	}

	const generateYearGrid = () => {
		const years = []
		for (let year = yearRange.start; year <= yearRange.end; year += 5) {
			const row = []
			for (let i = 0; i < 5 && year + i <= yearRange.end; i++) {
				row.push(year + i)
			}
			years.push(row)
		}
		return years
	}

	const isYearDisabled = (year: number) => {
		return year > maxYear || year < minYear
	}

	const formatDisplayYear = (date: Date) => {
		return format(date, 'yyyy', { locale: fr })
	}

	return (
		<Popover open={isOpen} onOpenChange={handlePopoverClose}>
			<PopoverTrigger asChild>
				<div>
					{label && <Label className="flex items-center">{label}</Label>}
					<Button
						variant="outline"
						type="button"
						className={cn(
							`min-w-[80px] flex items-center justify-between border-input font-normal ${label ? 'mt-3' : ''}`,
							className,
						)}
					>
						{!isDesktop && formatDisplayYear(selectedDate)}
						<Calendar className={`h-4 w-4 ${!isDesktop && 'ml-2'}`} />
					</Button>
				</div>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="center">
				<div className="p-3 min-w-[280px]">
					<div className="flex justify-between items-center mb-2">
						<button
							onClick={() => navigateYearRange(-1)}
							className="p-1 hover:bg-gray-100 rounded"
							disabled={yearRange.start <= minYear}
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
						<span className="text-sm font-medium">
							{yearRange.start} - {yearRange.end}
						</span>
						<button
							onClick={() => navigateYearRange(1)}
							className="p-1 hover:bg-gray-100 rounded"
							disabled={yearRange.start >= maxYear}
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
					<div className="grid grid-cols-5 gap-1">
						{generateYearGrid().map((row, rowIndex) => (
							<React.Fragment key={rowIndex}>
								{row.map(year => (
									<button
										key={year}
										onClick={() => handleYearClick(year)}
										disabled={isYearDisabled(year)}
										className={cn(
											'p-2 text-sm rounded',
											selectedDate.getFullYear() === year
												? 'bg-[#226C67] text-white'
												: 'hover:bg-gray-100',
											isYearDisabled(year) && 'opacity-50',
										)}
									>
										{year}
									</button>
								))}
							</React.Fragment>
						))}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}

export default YearPicker
