import { SelectInput } from '~/components/form/select-input'

interface Props {
	onStatusChange: (status: string) => void
}

export function FilterForm({ onStatusChange }: Readonly<Props>) {
	return (
		<div className="flex space-x-2">
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
