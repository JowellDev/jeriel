import { Calendar } from '../ui/calendar'
import { format } from 'date-fns'
import { CalendarIcon } from '@radix-ui/react-icons'
import { fr } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { cn } from '~/utils/ui'
import { Button } from '../ui/button'

interface DatePickerProps {
	selectedDate?: Date
	onSelectDate: (date: Date | undefined) => void
	className?: string
	isDesktop?: boolean
}

export function DatePicker({
	selectedDate = new Date(),
	onSelectDate,
	className,
	isDesktop,
}: Readonly<DatePickerProps>) {
	const handleSelectDate = (selectedDate?: Date) => {
		if (selectedDate) {
			onSelectDate(selectedDate)
		}
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant={'outline'}
					className={cn(
						'w-fit justify-start text-left font-normal capitalize mr-2 border-gray-200 border-input',
						className,
						!selectedDate && 'text-muted-foreground',
					)}
				>
					{isDesktop
						? format(selectedDate, 'dd/MM/yyyy', { locale: fr })
						: format(selectedDate, 'PPPP', { locale: fr })}

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
