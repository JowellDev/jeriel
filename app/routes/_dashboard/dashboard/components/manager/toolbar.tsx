import { type DateRange } from 'react-day-picker'
import MonthPicker from '~/components/form/month-picker'
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
		<div className="rounded-md border border-border bg-white text-foreground shadow-sm ">
			<div className="w-full flex items-center justify-end space-x-2 sm:space-x-4 p-2">
				{showSelectInput && onEntityChange && entityOptions && (
					<SelectInput
						placeholder="Sélectionner une entité"
						items={entityOptions}
						value={entityValue}
						onChange={onEntityChange}
					/>
				)}
				<MonthPicker
					onChange={onPeriodChange}
					isDesktop={true}
					className="min-w-fit items-center"
				/>
			</div>
		</div>
	)
}
