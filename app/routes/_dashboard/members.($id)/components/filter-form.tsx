import type { DateRange } from 'react-day-picker'
import { DateRangePicker } from '~/components/form/date-picker'
import { SelectInput } from '~/components/form/select-input'

interface Props {
	onStatusChange: (status: string) => void
	onPeriodChange: (value?: DateRange) => void
}

export function FilterForm({
	onStatusChange,
	onPeriodChange,
}: Readonly<Props>) {
	return (
		<div className="flex space-x-2">
			<DateRangePicker defaultLabel="Période" onValueChange={onPeriodChange} />
			<SelectInput
				placeholder="Départements"
				items={[]}
				onChange={onStatusChange}
			/>
			<SelectInput
				placeholder="Famille d'honneurs"
				items={[]}
				onChange={onStatusChange}
			/>
			<SelectInput placeholder="Tribus" items={[]} onChange={onStatusChange} />
			<SelectInput placeholder="Status" items={[]} onChange={onStatusChange} />
			<SelectInput
				placeholder="Etat"
				items={[{ label: 'Tous', value: 'all' }]}
				onChange={onStatusChange}
			/>
		</div>
	)
}
