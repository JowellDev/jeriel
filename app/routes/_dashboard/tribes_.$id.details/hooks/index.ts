import { useState, useCallback, useEffect } from 'react'
import { buildSearchParams } from '~/utils/url'
import type { MemberFilterOptions, SelectInputData } from '../types'
import { createOptions, filterUniqueOptions } from '../utils'
import type { Member } from '~/models/member.model'

export const useFilterState = () => {
	const [filters, setFilters] = useState({
		state: 'ALL',
		status: 'ALL',
	})

	const handleFilterChange = (
		filterType: 'state' | 'status',
		value: string,
	) => {
		setFilters(prev => ({ ...prev, [filterType]: value }))
	}

	return { filters, handleFilterChange }
}

export const useMemberOptions = (data: any) => {
	const [membersOption, setMembersOption] = useState<SelectInputData[]>([])

	useEffect(() => {
		const members = createOptions(data.members as unknown as Member[])
		const assistants = createOptions(
			data.tribeAssistants as unknown as Member[],
		)
		const allOptions = [...members, ...assistants]
		const newFormOptions = filterUniqueOptions(allOptions)

		setMembersOption(newFormOptions)
	}, [data])

	return membersOption
}

export const useTableData = (
	initialData: any,
	filters: any,
	load: (url: string) => void,
) => {
	const [data, setData] = useState(initialData)

	const reloadData = useCallback(
		(filterData: MemberFilterOptions) => {
			const params = buildSearchParams({
				...filterData,
				state: filters.state,
				status: filters.status,
			})
			load(`${location.pathname}?${params}`)
		},
		[load, filters],
	)

	return { data, setData, reloadData }
}
