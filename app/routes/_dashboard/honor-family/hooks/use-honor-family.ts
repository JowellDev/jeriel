import { type LoaderData } from '../server/loader.server'
import { useCallback, useEffect, useState } from 'react'
import {
	type useLoaderData,
	useFetcher,
	useSearchParams,
} from '@remix-run/react'
import type { ViewOption } from '~/components/toolbar'
import { useDebounceCallback } from 'usehooks-ts'
import { buildSearchParams } from '~/utils/url'
import { FORM_INTENT, STATUS } from '../constants'
import type { Option } from '~/components/form/multi-selector'
import type { MemberFilterOptions } from '../types'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'
import { getUniqueOptions } from '../utils/utils.client'
import { startOfMonth } from 'date-fns'
import { type ActionType } from '../server/action.server'

type LoaderReturnData = ReturnType<typeof useLoaderData<LoaderData>>

interface FilterOption {
	state?: string
	status?: STATUS
	from: string
	to: string
}

export function useHonorFamily(loaderData: LoaderReturnData) {
	const { load, ...fetcher } = useFetcher<LoaderData>({})
	const downloadFetcher = useFetcher<ActionType>()
	const [searchParams, setSearchParams] = useSearchParams()

	const [view, setView] = useState<ViewOption>('CULTE')
	const [statView, setStatView] = useState<ViewOption>('CULTE')
	const [filters, setFilters] = useState({ state: 'ALL', status: 'ALL' })
	const [currentMonth, setCurrentMonth] = useState(new Date())
	const [{ honorFamily, filterData }, setData] = useState(loaderData)
	const [membersOption, setMembersOption] = useState<Option[]>([])
	const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>()
	const [openManualForm, setOpenManualForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openAssistantForm, setOpenAssistantForm] = useState(false)
	const [openFilterForm, setOpenFilterForm] = useState(false)
	const [openAttendanceForm, setOpenAttendanceForm] = useState(false)
	const [isExporting, setIsExporting] = useState(false)

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
		setOpenAttendanceForm(false)

		if (shouldReload) reloadData({ ...filterData })
	}

	function handleExport() {
		setIsExporting(true)
		downloadFetcher.submit({ intent: FORM_INTENT.EXPORT }, { method: 'POST' })
	}

	useEffect(() => {
		if (filterData.from && filterData.to) {
			setCurrentMonth(new Date(startOfMonth(filterData.to)))
		}
	}, [filterData.from, filterData.to])

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
		currentMonth,
		view,
		statView,
		filters,
		dateRange,
		isExporting,
		searchParams,
		membersOption,
		openManualForm,
		openUploadForm,
		openFilterForm,
		openAssistantForm,
		openAttendanceForm,
		fetcher: { ...fetcher, load },
		downloadFetcher,
		setView,
		setStatView,
		handleClose,
		handleSearch,
		setDateRange,
		setIsExporting,
		setOpenManualForm,
		setOpenUploadForm,
		setOpenFilterForm,
		handleFilterChange,
		setOpenAssistantForm,
		setOpenAttendanceForm,
		handleExport,
		handleShowMoreTableData,
	}
}
