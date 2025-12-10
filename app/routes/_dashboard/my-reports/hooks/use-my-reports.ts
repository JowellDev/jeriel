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

type LoaderReturnData = ReturnType<typeof useLoaderData<LoaderType>>

export const useMyReports = (initialData: LoaderReturnData) => {
	const [data, setData] = useState(initialData)
	const { load, ...fetcher } = useFetcher<LoaderType>()
	const location = useLocation()
	const [openReportDetails, setOpenReportDetails] = useState(false)
	const [searchParams, setSearchParams] = useSearchParams()
	const [reportAttendances, setReportAttendances] = useState<
		AttendanceReport | undefined
	>()
	const debouncedLoad = useDebounceCallback(setSearchParams, 500)

	const [searchQuery, setSearchQuery] = useState('')
	const [filterData, setFilterData] = useState({
		...initialData.filterData,
	})

	const reloadData = useCallback(
		(option: FilterOption) => {
			const params = buildSearchParams(option)
			load(`${location.pathname}?${params}`)
		},
		[load, location.pathname],
	)

	const handleClose = () => {
		setOpenReportDetails(false)
		setReportAttendances(undefined)
		reloadData({ ...filterData, page: 1 })
	}

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

	function handleSeeDetails(reportAttendanceId: string) {
		setOpenReportDetails(true)
		const reportAttendances = data.reports.find(
			report => report?.id === reportAttendanceId,
		)

		if (reportAttendances) setReportAttendances(reportAttendances)
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
		openReportDetails,
		reportAttendances,
		handleSeeDetails,
		setOpenReportDetails,
		reloadData,
		handleClose,
		handleDisplayMore,
		handleSearch,
		searchQuery,
		filterData,
	}
}
