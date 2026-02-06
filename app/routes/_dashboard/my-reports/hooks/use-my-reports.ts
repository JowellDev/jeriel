import type { LoaderType } from '../loader.server'
import {
	useFetcher,
	type useLoaderData,
	useLocation,
	useSearchParams,
} from '@remix-run/react'
import { useState, useCallback, useEffect } from 'react'
import { useDebounceCallback } from 'usehooks-ts'
import { buildSearchParams } from '~/utils/url'
import type { FilterOption } from '../schema'
import type { AttendanceReport } from '~/routes/_dashboard/reports/model'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'
import type { DateRange } from 'react-day-picker'
import { parseISO } from 'date-fns'

type ReloadOption = Omit<FilterOption, 'from' | 'to'> & {
	from?: string
	to?: string
}

type LoaderReturnData = ReturnType<typeof useLoaderData<LoaderType>>

export const useMyReports = (initialData: LoaderReturnData) => {
	const [data, setData] = useState(initialData)
	const { load, ...fetcher } = useFetcher<LoaderType>()
	const location = useLocation()
	const [searchParams, setSearchParams] = useSearchParams()

	const [openReportDetails, setOpenReportDetails] = useState(false)
	const [openEditForm, setOpenEditForm] = useState(false)

	const [selectedReport, setSelectedReport] = useState<
		AttendanceReport | undefined
	>()
	const debouncedLoad = useDebounceCallback(setSearchParams, 500)

	const [searchQuery, setSearchQuery] = useState('')
	const [filterData, setFilterData] = useState<ReloadOption>({
		...initialData.filterData,
	})

	const [from, setFrom] = useState<Date | undefined>(
		initialData.filterData.from
			? parseISO(initialData.filterData.from)
			: undefined,
	)
	const [to, setTo] = useState<Date | undefined>(
		initialData.filterData.to ? parseISO(initialData.filterData.to) : undefined,
	)

	const reloadData = useCallback(
		(option: ReloadOption) => {
			const params = buildSearchParams(option)
			load(`${location.pathname}?${params}`)
		},
		[load, location.pathname],
	)

	const handleClose = () => {
		setOpenReportDetails(false)
		setOpenEditForm(false)
		setSelectedReport(undefined)
		reloadData({ ...filterData, page: 1 })
	}

	const handleOnPeriodChange = useCallback(
		(dateRange: DateRange | undefined) => {
			if (!dateRange) return
			setFrom(dateRange.from)
			setTo(dateRange.to)
		},
		[],
	)

	const handlePeriodFilter = useCallback(() => {
		const newFilterData = {
			...filterData,
			from: from ? from.toISOString() : undefined,
			to: to ? to.toISOString() : undefined,
			page: 1,
		}
		setFilterData(newFilterData)
		reloadData(newFilterData)
	}, [filterData, from, to, reloadData])

	const handleResetDateRange = useCallback(() => {
		setFrom(undefined)
		setTo(undefined)
		const newFilterData = {
			...filterData,
			from: undefined,
			to: undefined,
			page: 1,
		}
		setFilterData(newFilterData)
		reloadData(newFilterData)
	}, [filterData, reloadData])

	const handleSearch = (searchQuery: string) => {
		setSearchQuery(searchQuery)
		const newFilterData = {
			...filterData,
			query: searchQuery,
			page: 1,
		}
		setFilterData(newFilterData)
		const params = buildSearchParams(newFilterData)
		debouncedLoad(params)
	}

	const handleDisplayMore = () => {
		reloadData({
			...filterData,
			take: filterData.take + DEFAULT_QUERY_TAKE,
		})
	}

	function handleSeeDetails(report: AttendanceReport) {
		setOpenReportDetails(true)
		setSelectedReport(report)
	}

	function handleEditReport(report: AttendanceReport) {
		setOpenEditForm(true)
		setSelectedReport(report)
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		if (searchParams.toString()) {
			load(`${location.pathname}?${searchParams.toString()}`)
		}
	}, [searchParams, location.pathname, load])

	return {
		data,
		from,
		to,
		openEditForm,
		setOpenEditForm,
		openReportDetails,
		selectedReport,
		handleSeeDetails,
		handleEditReport,
		setOpenReportDetails,
		reloadData,
		handleClose,
		handleDisplayMore,
		handleSearch,
		handleOnPeriodChange,
		handlePeriodFilter,
		handleResetDateRange,
		searchQuery,
		filterData,
	}
}
