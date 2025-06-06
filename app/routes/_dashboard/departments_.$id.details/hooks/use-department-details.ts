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
import { endOfMonth, startOfMonth } from 'date-fns'
import { MemberStatus } from '~/shared/enum'
import type { MembersStats } from '~/components/stats/admin/types'
import { type DateRange } from 'react-day-picker'

type LoaderReturnData = SerializeFrom<LoaderType>

export const useDepartmentDetails = (initialData: LoaderReturnData) => {
	const [data, setData] = useState(initialData)
	const { load, ...fetcher } = useFetcher<LoaderType>()
	const { load: statLoad, ...statFetcher } = useFetcher<{
		oldMembersStats: MembersStats[]
		newMembersStats: MembersStats[]
	}>()
	const [isFetching, setIsFetching] = useState(false)

	const [searchParams, setSearchParams] = useSearchParams()

	const [view, setView] = useState<ViewOption>('CULTE')
	const [statView, setStatView] = useState<ViewOption>('CULTE')
	const [currentMonth, setCurrentMonth] = useState(new Date())

	const [membersOption, setMembersOption] = useState<Option[]>([])
	const [openManualForm, setOpenManualForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openAssistantForm, setOpenAssistantForm] = useState(false)
	const [openFilterForm, setOpenFilterForm] = useState(false)

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
					status: MemberStatus.NEW,
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

	const handleClose = useCallback(() => {
		setOpenManualForm(false)
		setOpenUploadForm(false)
		setOpenAssistantForm(false)
		reloadData({ ...data.filterData, page: 1 })
	}, [data.filterData, reloadData])

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
					`/api/statistics?departmentId=${data.department.id}&from=${range.from.toISOString()}&to=${range.to.toISOString()}`,
				)
			}
		},
		[data.department.id, loadStats],
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
		const uniqueOptions = getUniqueOptions(data.members, data.assistants)
		setMembersOption(uniqueOptions)
	}, [data.members, data.assistants])

	useEffect(() => {
		if (view === 'STAT' && data?.department?.id)
			loadStats(
				`/api/statistics?departmentId=${data.department.id}&from=${startOfMonth(currentMonth).toISOString()}&to=${endOfMonth(currentMonth).toISOString()}`,
			)
	}, [currentMonth, data.department.id, loadStats, view])

	useEffect(() => {
		if (statFetcher.state === 'loading') {
			setIsFetching(true)
		} else if (statFetcher.state === 'idle' && statFetcher.data) {
			setIsFetching(false)
		}
	}, [statFetcher.state, statFetcher.data])

	return {
		data,
		view,
		currentMonth,
		setView: handleViewChange,
		statView,
		setStatView,
		membersOption,
		memberStats: statFetcher.data,
		isFetching,
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
		openFilterForm,
		setOpenFilterForm,
		handleOnPeriodChange,
	}
}
