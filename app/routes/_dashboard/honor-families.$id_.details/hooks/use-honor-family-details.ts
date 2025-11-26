import { useState, useEffect, useCallback } from 'react'
import {
	type useLoaderData,
	useFetcher,
	useSearchParams,
} from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import { buildSearchParams } from '~/utils/url'
import type { ViewOption } from '~/components/toolbar'
import type { LoaderData } from '../server/loader.server'
import type { MemberFilterOptions } from '../types'
import { STATUS } from '../constants'
import { endOfMonth, startOfMonth } from 'date-fns'
import type { MembersStats } from '~/components/stats/admin/types'
import type { DateRange } from 'react-day-picker'

type LoaderReturnData = ReturnType<typeof useLoaderData<LoaderData>>

export const useHonorFamilyDetails = (initialData: LoaderReturnData) => {
	const [data, setData] = useState(initialData)
	const { load, ...fetcher } = useFetcher<LoaderData>()
	const { load: statLoad, ...statFetcher } = useFetcher<{
		oldMembersStats: MembersStats[]
		newMembersStats: MembersStats[]
	}>()
	const [isFetching, setIsFetching] = useState(false)

	const [searchParams, setSearchParams] = useSearchParams()

	const [view, setView] = useState<ViewOption>('CULTE')
	const [statView, setStatView] = useState<ViewOption>('CULTE')
	const [currentMonth, setCurrentMonth] = useState(new Date())

	const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>()
	const [openManualForm, setOpenManualForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openAssistantForm, setOpenAssistantForm] = useState(false)
	const [openFilterForm, setOpenFilterForm] = useState(false)
	const [openAttendanceForm, setOpenAttendanceForm] = useState(false)

	const debounced = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(newFilterData: MemberFilterOptions) => {
			const params = buildSearchParams({
				...newFilterData,
			})
			load(`${location.pathname}?${params}`)
		},
		[load],
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

	const handleViewChange = useCallback(
		(newView: ViewOption) => {
			setView(newView)
			const currentFilter = data.filterData
			if (newView === 'STAT') {
				reloadData({
					...currentFilter,
					status: STATUS.NEW,
					page: 1,
				})
			} else {
				reloadData({
					...currentFilter,
					status: undefined,
					page: 1,
				})
			}
		},
		[data.filterData, reloadData],
	)

	const handleFilterChange = useCallback(
		(options: { state?: string; status?: string }) => {
			const newFilterData = {
				...data.filterData,
				...options,
				page: 1,
			}
			reloadData(newFilterData)
		},
		[data.filterData, reloadData],
	)

	const handleShowMoreTableData = useCallback(() => {
		reloadData({ ...data.filterData, page: data.filterData.page + 1 })
	}, [data.filterData, reloadData])

	const handleClose = (shouldReload = true) => {
		setOpenManualForm(false)
		setOpenUploadForm(false)
		setOpenAssistantForm(false)
		setOpenFilterForm(false)

		if (shouldReload) reloadData({ ...data.filterData, page: 1 })
	}

	const loadStats = useCallback(
		(url: string) => {
			setIsFetching(true)
			statLoad(url)
		},
		[statLoad],
	)

	const handleOnPeriodChange = useCallback(
		(range: DateRange) => {
			if (range.from && range.to) {
				loadStats(
					`/api/statistics?honorFamilyId=${data.honorFamily.id}&from=${range.from.toISOString()}&to=${range.to.toISOString()}`,
				)
			}
		},
		[data.honorFamily.id, loadStats],
	)

	useEffect(() => {
		if (data.filterData.from && data.filterData.to) {
			setCurrentMonth(new Date(startOfMonth(data.filterData.to)))
		}
	}, [data.filterData.from, data.filterData.to])

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		load(`${location.pathname}?${searchParams}`)
	}, [load, searchParams])

	useEffect(() => {
		if (view === 'STAT' && data.honorFamily?.id)
			loadStats(
				`/api/statistics?honorFamilyId=${data.honorFamily?.id}&from=${startOfMonth(currentMonth).toISOString()}&to=${endOfMonth(currentMonth).toISOString()}`,
			)
	}, [currentMonth, data.honorFamily?.id, loadStats, view])

	useEffect(() => {
		if (statFetcher.state === 'loading') {
			setIsFetching(true)
		} else if (statFetcher.state === 'idle' && statFetcher.data) {
			setIsFetching(false)
		}
	}, [statFetcher.state, statFetcher.data])

	return {
		data,
		currentMonth,
		view,
		statView,
		dateRange,
		searchParams,
		openManualForm,
		openUploadForm,
		openFilterForm,
		openAssistantForm,
		openAttendanceForm,
		fetcher: { ...fetcher, load },
		memberStats: statFetcher.data,
		isFetching,
		setView: handleViewChange,
		setStatView,
		handleClose,
		handleSearch,
		setDateRange,
		setOpenManualForm,
		setOpenUploadForm,
		setOpenFilterForm,
		handleFilterChange,
		setOpenAssistantForm,
		setOpenAttendanceForm,
		handleShowMoreTableData,
		handleOnPeriodChange,
	}
}
