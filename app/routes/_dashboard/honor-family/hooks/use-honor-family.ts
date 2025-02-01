import type { SerializeFrom } from '@remix-run/node'
import { type LoaderType } from '../loader.server'
import { useCallback, useEffect, useState } from 'react'
import { useFetcher, useSearchParams } from '@remix-run/react'
import type { ViewOption } from '~/components/toolbar'
import { useDebounceCallback } from 'usehooks-ts'
import { startOfMonth } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import type { MemberFilterOptions } from '~/shared/types'
import { buildSearchParams } from '~/utils/url'
import { speedDialItemsActions } from '../constants'

type LoaderReturnData = SerializeFrom<LoaderType>

export function useHonorFamily(loaderData: LoaderReturnData) {
	const [data, setData] = useState(loaderData)
	const { load, ...fetcher } = useFetcher<LoaderType>()

	const [view, setView] = useState<ViewOption>('CULTE')
	const [openCreateForm, setOpenCreateForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openFilterForm, setOpenFilterForm] = useState(false)
	const [currentMonth, setCurrentMonth] = useState(new Date())
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)
	const [openAttendanceForm, setOpenAttendanceForm] = useState(false)

	const reloadData = useCallback(
		(data: MemberFilterOptions) => {
			const params = buildSearchParams(data)
			load(`${location.pathname}?${params}`)
		},
		[load],
	)

	const handleClose = useCallback(() => {
		setOpenCreateForm(false)
		setOpenUploadForm(false)
		setOpenAttendanceForm(false)
		reloadData({ ...data.filterData, page: 1 })
	}, [data.filterData, reloadData])

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

	function handleDisplayMore() {
		const filterData = data.filterData
		reloadData({ ...filterData, page: filterData.page + 1 })
	}

	function handleOnExport() {
		//
	}

	const handleSpeedDialItemClick = (action: string) => {
		switch (action) {
			case speedDialItemsActions.CREATE_MEMBER:
				return setOpenCreateForm(true)
			case speedDialItemsActions.UPLOAD_MEMBERS:
				return setOpenUploadForm(true)
			case speedDialItemsActions.MARK_ATTENDANCE:
				break
			default:
				break
		}
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
		view,
		fetcher,
		openCreateForm,
		openFilterForm,
		openUploadForm,
		openAttendanceForm,
		setOpenAttendanceForm,
		currentMonth,
		setView,
		handleClose,
		handleSearch,
		handleOnFilter,
		handleOnExport,
		handleDisplayMore,
		setOpenCreateForm,
		setOpenFilterForm,
		setOpenUploadForm,
		handleOnPeriodChange,
		handleSpeedDialItemClick,
	}
}
