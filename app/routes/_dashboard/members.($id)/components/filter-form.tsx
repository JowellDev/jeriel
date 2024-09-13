import { useFetcher } from '@remix-run/react'
import type { DateRange } from 'react-day-picker'
import { DateRangePicker } from '~/components/form/date-picker'
import { SelectInput } from '~/components/form/select-input'
import { type MemberFilterOptionsApiData } from '~/api/get-members-filter-select-options/_index'
import { useEffect, useState } from 'react'
import { type SelectOption } from '~/shared/types'
import { SELECT_ALL_OPTION } from '~/shared/constants'

interface Options {
	departments: SelectOption[]
	honorFamilies: SelectOption[]
	tribes: SelectOption[]
	states: SelectOption[]
	status: SelectOption[]
}

interface Props {
	onStatusChange: (status: string) => void
	onPeriodChange: (value?: DateRange) => void
}

export function FilterForm({
	onStatusChange,
	onPeriodChange,
}: Readonly<Props>) {
	const { load, ...fetcher } = useFetcher<MemberFilterOptionsApiData>()
	const [options, setOptions] = useState<Options>({
		honorFamilies: [],
		departments: [],
		tribes: [],
		states: [],
		status: [],
	})

	useEffect(() => {
		load('/api/get-members-filter-select-options')
	}, [load])

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data) {
			setOptions(fetcher.data)
		}
	}, [fetcher.data, fetcher.state])

	return (
		<div className="flex space-x-2">
			<DateRangePicker defaultLabel="Période" onValueChange={onPeriodChange} />
			<SelectInput
				placeholder="Départements"
				items={[
					{ ...SELECT_ALL_OPTION, label: 'Tous les départements' },
					...options.departments,
				]}
				onChange={onStatusChange}
			/>
			<SelectInput
				placeholder="Famille d'honneurs"
				items={[
					{ ...SELECT_ALL_OPTION, label: 'Tous les familles' },
					...options.honorFamilies,
				]}
				onChange={onStatusChange}
			/>
			<SelectInput
				placeholder="Tribus"
				items={[
					{ ...SELECT_ALL_OPTION, label: 'Toutes les tribus' },
					...options.tribes,
				]}
				onChange={onStatusChange}
			/>
			<SelectInput
				placeholder="Status"
				items={[
					{ ...SELECT_ALL_OPTION, label: 'Tous les statuts' },
					...options.status,
				]}
				onChange={onStatusChange}
			/>
			<SelectInput
				placeholder="Etat"
				items={[
					{ ...SELECT_ALL_OPTION, label: 'Tous les états' },
					...options.states,
				]}
				onChange={onStatusChange}
			/>
		</div>
	)
}
