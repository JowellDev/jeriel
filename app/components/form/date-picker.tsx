import { format } from 'date-fns'
import { CalendarIcon } from '@radix-ui/react-icons'
import { fr } from 'date-fns/locale'

import { cn } from '~/utils/ui'

import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'

interface DatePickerProps {
	selectedDate?: Date
	onSelectDate: (date: Date | undefined) => void
	className?: string
	isDesktop?: boolean
}

export function DatePicker({
	selectedDate,
	onSelectDate,
	className,
	isDesktop,
}: Readonly<DatePickerProps>) {
	const handleSelectDate = (selectedDate?: Date) => {
		if (selectedDate) {
			onSelectDate(selectedDate)
		}
	}

	const formatSelectedDate = (date: Date) => {
		const pattern = isDesktop ? 'dd/MM/yyyy' : 'EEEE dd MMMM yyyy'
		return format(date, pattern, { locale: fr })
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={'outline'}
					className={cn(
						'w-fit justify-start text-left font-normal mr-2 border-gray-200 border-input',
						className,
						!selectedDate && 'text-muted-foreground',
					)}
				>
					{selectedDate
						? formatSelectedDate(selectedDate)
						: 'Sélectionner une date'}

					<CalendarIcon className={`h-4 w-4 ml-1 ${isDesktop && 'h-3 w-3'}`} />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="flex w-auto flex-col space-y-2 p-2 border-gray-200">
				<Calendar
					mode="single"
					selected={selectedDate}
					onSelect={handleSelectDate}
					initialFocus
					disabled={date => date > new Date()}
					locale={fr}
				/>
			</PopoverContent>
		</Popover>
	)
}
