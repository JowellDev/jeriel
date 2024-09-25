import { useState, useEffect, useCallback } from 'react'
import { useFetcher, useSearchParams } from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import type { MemberFilterOptions } from '../models'
import { buildSearchParams } from '~/utils/url'
import type { LoaderType } from '../loader.server'
import type { SerializeFrom } from '@remix-run/node'
import type { Option } from '~/components/form/multi-selector'
import { getUniqueOptions } from '../utils/option.utils'
import type { ViewOption } from '~/components/toolbar'

type LoaderReturnData = SerializeFrom<LoaderType>

export const useDepartmentDetails = (initialData: LoaderReturnData) => {
	const [data, setData] = useState(initialData)
	const { load, ...fetcher } = useFetcher<LoaderType>()
	const [searchParams, setSearchParams] = useSearchParams()

	const [view, setView] = useState<ViewOption>('CULTE')
	const [statView, setStatView] = useState<ViewOption>('CULTE')

	const [filters, setFilters] = useState({ state: 'ALL', status: 'ALL' })
	const [membersOption, setMembersOption] = useState<Option[]>([])
	const [openManualForm, setOpenManualForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openAssistantForm, setOpenAssistantForm] = useState(false)

	const debounced = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(newFilterData: MemberFilterOptions) => {
			const params = buildSearchParams({
				...newFilterData,
				state: filters.state,
				status: filters.status,
			})
			load(`${location.pathname}?${params}`)
		},
		[load, filters],
	)

	const handleSearch = useCallback(
		(searchQuery: string) => {
			const params = buildSearchParams({
				...data.filterData,
				query: searchQuery,
				page: 1,
			})
			debounced(params)
		},
		[data.filterData, debounced],
	)

	const handleFilterChange = useCallback(
		(filterType: 'state' | 'status', value: string) => {
			setFilters(prev => ({ ...prev, [filterType]: value }))
			const newFilterData = {
				...data.filterData,
				[filterType]: value,
				page: 1,
			}
			reloadData(newFilterData)
		},
		[data.filterData, reloadData],
	)

	const handleShowMoreTableData = useCallback(() => {
		reloadData({ ...data.filterData, page: data.filterData.page + 1 })
	}, [data.filterData, reloadData])

	const handleClose = useCallback(() => {
		setOpenManualForm(false)
		setOpenUploadForm(false)
		setOpenAssistantForm(false)
		reloadData({ ...data.filterData, page: 1 })
	}, [data.filterData, reloadData])

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		load(`${location.pathname}?${searchParams}`)
	}, [load, searchParams])

	useEffect(() => {
		const uniqueOptions = getUniqueOptions(data.members, data.assistants)
		setMembersOption(uniqueOptions)
	}, [data.members, data.assistants])

	return {
		data,
		view,
		setView,
		statView,
		setStatView,
		filters,
		membersOption,
		openManualForm,
		setOpenManualForm,
		openUploadForm,
		setOpenUploadForm,
		openAssistantForm,
		setOpenAssistantForm,
		handleSearch,
		handleFilterChange,
		handleShowMoreTableData,
		handleClose,
	}
}
