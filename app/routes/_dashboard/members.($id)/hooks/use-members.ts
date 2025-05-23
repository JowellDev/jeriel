import { useCallback, useEffect, useState } from 'react'
import type { LoaderType } from '../loader.server'
import { useFetcher, useSearchParams } from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import type { MemberFilterOptions } from '../types'
import { buildSearchParams } from '~/utils/url'
import type { DateRange } from 'react-day-picker'
import { startOfMonth } from 'date-fns'
import type { SerializeFrom } from '@remix-run/node'
import { FORM_INTENT, speedDialItemsActions } from '../constants'
import { useDownloadFile } from '~/shared/hooks'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'

type LoaderReturnData = SerializeFrom<LoaderType>

export function useMembers(loaderData: LoaderReturnData) {
	const [data, setData] = useState(loaderData)
	const [isExporting, setIsExporting] = useState(false)
	const { load, ...fetcher } = useFetcher<LoaderType>()

	useDownloadFile({ ...fetcher, load }, { isExporting, setIsExporting })

	const [openManualForm, setOpenManualForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openFilterForm, setOpenFilterForm] = useState(false)
	const [currentMonth, setCurrentMonth] = useState(new Date())
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(data: MemberFilterOptions) => {
			const params = buildSearchParams(data)
			setSearchParams(params)
		},
		[setSearchParams],
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

		setOpenFilterForm(false)
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
	}

	function handleDisplayMore() {
		const params = buildSearchParams({
			...data.filterData,
			take: data.filterData.take + DEFAULT_QUERY_TAKE,
		})
		setSearchParams(params)
	}

	function handleExport(): void {
		setIsExporting(true)
		fetcher.submit({ intent: FORM_INTENT.EXPORT }, { method: 'post' })
	}

	useEffect(() => {
		setData(loaderData)
	}, [loaderData])

	useEffect(() => {
		load(`${location.pathname}?${searchParams}`)
	}, [load, searchParams])

	return {
		data,
		fetcher,
		openManualForm,
		openUploadForm,
		openFilterForm,
		currentMonth,
		isExporting,
		handleSearch,
		handleSpeedDialItemClick,
		handleDisplayMore,
		handleOnFilter,
		handleOnPeriodChange,
		handleExport,
		handleClose,
		setOpenManualForm,
		setOpenUploadForm,
		setOpenFilterForm,
	}
}
