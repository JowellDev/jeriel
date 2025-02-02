import { useState, useEffect, useCallback } from 'react'
import { useFetcher, useSearchParams } from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import { buildSearchParams } from '~/utils/url'
import type { SerializeFrom } from '@remix-run/node'
import type { Option } from '~/components/form/multi-selector'
import type { ViewOption } from '~/components/toolbar'
import type { LoaderData } from '../loader.server'
import type { MemberFilterOptions } from '../types'
import { STATUS } from '../constants'
import { getUniqueOptions } from '../utils/utils.client'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'

type LoaderReturnData = SerializeFrom<LoaderData>
interface FilterOption {
	state?: string
	status?: STATUS
	from?: string
	to?: string
}

export const useHonorFamilyDetails = (initialData: LoaderReturnData) => {
	const { load, ...fetcher } = useFetcher<LoaderData>({})
	const [searchParams, setSearchParams] = useSearchParams()

	const [view, setView] = useState<ViewOption>('CULTE')
	const [statView, setStatView] = useState<ViewOption>('CULTE')
	const [filters, setFilters] = useState({ state: 'ALL', status: 'ALL' })

	const [{ honorFamily, filterData }, setData] = useState(initialData)
	const [membersOption, setMembersOption] = useState<Option[]>([])
	const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>()
	const [openManualForm, setOpenManualForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openAssistantForm, setOpenAssistantForm] = useState(false)
	const [openFilterForm, setOpenFilterForm] = useState(false)

	const reloadData = useCallback(
		(data: MemberFilterOptions) => {
			const params = buildSearchParams({ ...data })

			setSearchParams(params)
			load(`${location.pathname}?${params}`)
		},
		[load, setSearchParams],
	)

	const debounced = useDebounceCallback(reloadData, 500)

	const handleSearch = (searchQuery: string) => {
		debounced({ ...filterData, query: searchQuery })
	}

	const handleFilterChange = ({ state, status, from, to }: FilterOption) => {
		const newFilters = {
			state: state ?? 'ALL',
			status: status ?? STATUS.ALL,
		}
		setFilters(newFilters)
		setDateRange({ from, to })

		const newFilterData = {
			...filterData,
			...newFilters,
			from,
			to,
		}

		reloadData(newFilterData)
	}

	const handleShowMoreTableData = () => {
		reloadData({ ...filterData, take: filterData.take + DEFAULT_QUERY_TAKE })
	}

	const handleClose = (shouldReload = true) => {
		setOpenManualForm(false)
		setOpenUploadForm(false)
		setOpenAssistantForm(false)
		setOpenFilterForm(false)

		if (shouldReload) reloadData({ ...filterData })
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		const uniqueOptions = getUniqueOptions(
			honorFamily.members,
			honorFamily.assistants,
		)

		setMembersOption(uniqueOptions)
	}, [honorFamily.members, honorFamily.assistants])

	return {
		honorFamily,
		filterData,
		view,
		setView,
		setStatView,
		fetcher: { ...fetcher, load },
		statView,
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
		dateRange,
		setDateRange,
		handleClose,
		handleSearch,
		handleFilterChange,
		handleShowMoreTableData,
	}
}
