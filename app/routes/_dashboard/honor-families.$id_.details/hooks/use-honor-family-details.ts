import { useState, useEffect, useCallback } from 'react'
import { useFetcher, useSearchParams } from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import { buildSearchParams } from '~/utils/url'
import type { SerializeFrom } from '@remix-run/node'
import type { Option } from '~/components/form/multi-selector'
import type { ViewOption } from '~/components/toolbar'
import type { LoaderData } from '../loader.server'
import type { MemberFilterOptions } from '../types'

type LoaderReturnData = SerializeFrom<LoaderData>
interface FilterOption {
	state?: string
	status?: string
	from?: string
	to?: string
}

export const useHonorFamilyDetails = (initialData: LoaderReturnData) => {
	const { load, ...fetcher } = useFetcher<LoaderData>({})
	const [searchParams, setSearchParams] = useSearchParams()

	const [view, setView] = useState<ViewOption>('CULTE')
	const [filters, setFilters] = useState({ state: 'ALL', status: 'ALL' })

	const [data, setData] = useState(initialData)
	const [membersOption, setMembersOption] = useState<Option[]>([])
	const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>()
	const [openManualForm, setOpenManualForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openAssistantForm, setOpenAssistantForm] = useState(false)
	const [openFilterForm, setOpenFilterForm] = useState(false)

	const debounced = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(data: MemberFilterOptions) => {
			const params = buildSearchParams({ ...data })

			setSearchParams(params)
			load(`${location.pathname}?${params}`)
		},
		[filters, dateRange],
	)

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			...data.filterData,
			query: searchQuery,
		})
		debounced(params)
	}

	const handleFilterChange = ({ state, status, from, to }: FilterOption) => {
		const newFilters = {
			state: state || 'ALL',
			status: status || 'ALL',
		}
		setFilters(newFilters)
		setDateRange({ from, to })

		const newFilterData = {
			...data.filterData,
			...newFilters,
			from,
			to,
		}

		reloadData(newFilterData)
	}

	const handleShowMoreTableData = () => {
		reloadData({ ...data.filterData, take: data.filterData.take + 5 })
	}

	const handleClose = (shouldReload = true) => {
		setOpenManualForm(false)
		setOpenUploadForm(false)
		setOpenAssistantForm(false)
		setOpenFilterForm(false)

		if (shouldReload) reloadData({ ...data.filterData })
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data, data])

	useEffect(() => {
		setMembersOption(data.honorFamily.membersWithoutAssistants)
	}, [data.honorFamily.membersWithoutAssistants])

	return {
		data,
		view,
		setView,
		filters,
		searchParams,
		membersOption,
		openManualForm,
		setOpenManualForm,
		openUploadForm,
		setOpenUploadForm,
		openAssistantForm,
		setOpenAssistantForm,
		openFilterForm,
		setOpenFilterForm,
		handleClose,
		handleSearch,
		handleFilterChange,
		handleShowMoreTableData,
	}
}
