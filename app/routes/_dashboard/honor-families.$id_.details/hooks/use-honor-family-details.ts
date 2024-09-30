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

export const useHonorFamilyDetails = (initialData: LoaderReturnData) => {
	const [data, setData] = useState(initialData)
	const fetcher = useFetcher<LoaderData>({ key: 'fetch-honor-family-members' })
	const [searchParams, setSearchParams] = useSearchParams()

	const [view, setView] = useState<ViewOption>('CULTE')

	const [filters, setFilters] = useState({ state: 'ALL', status: 'ALL' })
	const [membersOption, setMembersOption] = useState<Option[]>([])
	const [openManualForm, setOpenManualForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openAssistantForm, setOpenAssistantForm] = useState(false)
	const [openFilterForm, setOpenFilterForm] = useState(false)

	const debounced = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(data: MemberFilterOptions) => {
			const params = buildSearchParams({ ...data })

			setSearchParams(params)
			fetcher.load(`${location.pathname}?${params}`)
		},
		[fetcher.load, filters],
	)

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			...data.filterData,
			query: searchQuery,
			page: 1,
		})
		debounced(params)
	}

	const handleFilterChange = (
		filterType: 'state' | 'status',
		value: string,
	) => {
		setFilters(prev => ({ ...prev, [filterType]: value }))
		const newFilterData = {
			...data.filterData,
			[filterType]: value,
			page: 1,
		}
		reloadData(newFilterData)
	}

	const handleShowMoreTableData = () => {
		reloadData({ ...data.filterData, take: data.filterData.take + 5 })
	}

	const handleClose = () => {
		setOpenManualForm(false)
		setOpenUploadForm(false)
		setOpenAssistantForm(false)
		setOpenFilterForm(false)
		reloadData({ ...data.filterData, page: 1 })
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		setMembersOption(data.honorFamily.membersWithoutAssistants)
	}, [data.honorFamily.membersWithoutAssistants])

	return {
		data,
		view,
		setView,
		filters,
		membersOption,
		openManualForm,
		setOpenManualForm,
		openUploadForm,
		setOpenUploadForm,
		openAssistantForm,
		setOpenAssistantForm,
		openFilterForm,
		reloadData,
		setOpenFilterForm,
		handleClose,
		handleSearch,
		handleFilterChange,
		handleShowMoreTableData,
	}
}
