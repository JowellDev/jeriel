import { useCallback, useEffect, useState } from 'react'
import { LoaderType } from '../loader.server'
import { useFetcher, useSearchParams } from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import { MemberFilterOptions } from '../types'
import { buildSearchParams } from '~/utils/url'
import { DateRange } from 'react-day-picker'
import { startOfMonth } from 'date-fns'
import { SerializeFrom } from '@remix-run/node'
import { speedDialItemsActions } from '../constants'

type LoaderReturnData = SerializeFrom<LoaderType>

export function useMembers(loaderData: LoaderReturnData) {
	const [data, setData] = useState(loaderData)
	const { load, ...fetcher } = useFetcher<LoaderType>()

	const [openManualForm, setOpenManualForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openFilterForm, setOpenFilterForm] = useState(false)
	const [currentMounth, setCurrentMonth] = useState<Date>(new Date())
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(data: MemberFilterOptions) => {
			const params = buildSearchParams(data)
			load(`${location.pathname}?${params}`)
		},
		[load],
	)

	const handleClose = () => {
		setOpenManualForm(false)
		setOpenUploadForm(false)
		setOpenFilterForm(false)
		reloadData({ ...data.filterData, page: 1 })
	}

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			...data.filterData,
			query: searchQuery,
			page: 1,
		})
		debounced(params)
	}

	function handleOnFilter(options: MemberFilterOptions) {
		reloadData({
			...data.filterData,
			...options,
			page: 1,
		})
	}

	function handleOnPeriodChange(range: DateRange) {
		if (range.from && range.to) {
			const filterData = {
				...data.filterData,
				from: range?.from?.toISOString(),
				to: range?.to?.toISOString(),
				page: 1,
			}

			setCurrentMonth(startOfMonth(range.to))
			reloadData(filterData)
		}
	}

	const handleSpeedDialItemClick = (action: string) => {
		if (action === speedDialItemsActions.ADD_MEMBER) setOpenManualForm(true)
		if (action === speedDialItemsActions.UPLOAD_FILE) setOpenUploadForm(true)
		if (action === speedDialItemsActions.FILTER_MEMBERS) setOpenFilterForm(true)
	}

	function handleDisplayMore() {
		const filterData = data.filterData
		reloadData({ ...filterData, page: filterData.page + 1 })
	}

	function handleOnExport() {
		//
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		load(`${location.pathname}?${searchParams}`)
	}, [load, searchParams])

	return {
		data,
		fetcher,
		openManualForm,
		openUploadForm,
		openFilterForm,
		currentMounth,
		handleSearch,
		handleSpeedDialItemClick,
		handleDisplayMore,
		handleOnFilter,
		handleOnPeriodChange,
		handleOnExport,
		handleClose,
		setOpenManualForm,
		setOpenUploadForm,
		setOpenFilterForm,
	}
}
