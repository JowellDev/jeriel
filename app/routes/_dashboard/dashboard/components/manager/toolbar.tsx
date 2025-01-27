import { type DateRange } from 'react-day-picker'
import DateSelector from '~/components/form/date-selector'
import { SelectInput } from '~/components/form/select-input'

interface Props {
	onPeriodChange: (range: DateRange) => void
	onEntityChange?: (entityId: string) => void
	showSelectInput?: boolean
	entityOptions?: {
		value: string | undefined
		label: string
	}[]
	entityValue?: string
}

export function Toolbar({
	onPeriodChange,
	onEntityChange,
	entityOptions,
	entityValue,
	showSelectInput,
}: Readonly<Props>) {
	return (
		<div className="rounded-md border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
			<div className="w-full flex items-center justify-end space-x-2 sm:space-x-4 p-2">
				{showSelectInput && onEntityChange && entityOptions && (
					<SelectInput
						placeholder="Sélectionner une entité"
						items={entityOptions}
						value={entityValue}
						onChange={onEntityChange}
					/>
				)}
				<DateSelector
					onChange={onPeriodChange}
					isDesktop={true}
					className="min-w-fit items-center"
				/>
			</div>
		</div>
	)
}
