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
import type { FilterOption, MemberFilterOptions } from '../schema'
import type { AttendanceReport, MemberWithAttendancesConflicts } from '../model'
import { type ViewOption } from '~/components/toolbar'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'

type LoaderReturnData = ReturnType<typeof useLoaderData<LoaderType>>

export const useReport = (initialData: LoaderReturnData) => {
	const [openForm, setOpenForm] = useState(false)
	const [data, setData] = useState(initialData)
	const { load, ...fetcher } = useFetcher<LoaderType>()
	const location = useLocation()
	const [openReportDetails, setOpenReportDetails] = useState(false)
	const [searchParams, setSearchParams] = useSearchParams()
	const [reportAttendances, setReportAttendances] = useState<
		AttendanceReport | undefined
	>()
	const [openConflictForm, setOpenConflictForm] = useState(false)
	const [attendanceConflict, setAttendanceConflict] = useState<
		MemberWithAttendancesConflicts | undefined
	>()
	const debouncedLoad = useDebounceCallback(setSearchParams, 500)
	const [view, setView] = useState<ViewOption>('REPORTS')
	const [openFilterForm, setOpenFilterForm] = useState(false)

	const [reportSearchQuery, setReportSearchQuery] = useState('')
	const [reportFilterData, setReportFilterData] = useState({
		...initialData.filterData,
	})
	const [conflictSearchQuery, setConflictSearchQuery] = useState('')
	const [conflictFilterData, setConflictFilterData] = useState({
		...initialData.filterData,
		filterType: 'conflicts' as const,
	})
	const [trackingSearchQuery, setTrackingSearchQuery] = useState('')
	const [trackingFilterData, setTrackingFilterData] = useState({
		...initialData.filterData,
		filterType: 'tracking' as const,
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
		setOpenConflictForm(false)
		setAttendanceConflict(undefined)

		if (view === 'REPORTS') {
			reloadData({ ...reportFilterData, page: 1 })
		} else if (view === 'REPORT_TRACKING') {
			reloadData({ ...trackingFilterData, page: 1 })
		} else {
			reloadData({ ...conflictFilterData, page: 1 })
		}
	}

	const handleSearch = (searchQuery: string) => {
		if (view === 'REPORTS') {
			setReportSearchQuery(searchQuery)
			const newFilterData = {
				...reportFilterData,
				query: searchQuery,
				page: 1,
			}
			setReportFilterData(newFilterData)
			const params = buildSearchParams(newFilterData)
			debouncedLoad(params)
		} else if (view === 'REPORT_TRACKING') {
			setTrackingSearchQuery(searchQuery)
			const newFilterData = {
				...trackingFilterData,
				query: searchQuery,
				page: 1,
			}
			setTrackingFilterData(newFilterData)
			const params = buildSearchParams(newFilterData)
			debouncedLoad(params)
		} else {
			setConflictSearchQuery(searchQuery)
			const newFilterData = {
				...conflictFilterData,
				query: searchQuery,
				page: 1,
			}
			setConflictFilterData(newFilterData)
			const params = buildSearchParams(newFilterData)
			debouncedLoad(params)
		}
	}

	const handleDisplayMore = () => {
		if (view === 'REPORTS') {
			reloadData({
				...reportFilterData,
				take: reportFilterData.take + DEFAULT_QUERY_TAKE,
			})
		} else if (view === 'REPORT_TRACKING') {
			reloadData({
				...trackingFilterData,
				take: trackingFilterData.take + DEFAULT_QUERY_TAKE,
			})
		} else {
			reloadData({
				...conflictFilterData,
				take: conflictFilterData.take + DEFAULT_QUERY_TAKE,
			})
		}
	}

	function handleOnFilter(options: MemberFilterOptions) {
		if (view === 'REPORTS') {
			const newFilterData = {
				...reportFilterData,
				...options,
				filterType: 'reports' as const,
				page: 1,
			}
			setReportFilterData({ ...newFilterData })
			reloadData(newFilterData)
		} else if (view === 'REPORT_TRACKING') {
			const newFilterData = {
				...trackingFilterData,
				...options,
				filterType: 'tracking' as const,
				page: 1,
			}
			setTrackingFilterData({ ...newFilterData })
			reloadData(newFilterData)
		} else {
			const newFilterData = {
				...conflictFilterData,
				...options,
				filterType: 'conflicts' as const,
				page: 1,
			}
			setConflictFilterData({ ...newFilterData })
			reloadData(newFilterData)
		}
		setOpenFilterForm(false)
	}

	function handleSeeDetails(reportAttendanceId: string) {
		setOpenReportDetails(true)
		const reportAttendances = data.attendanceReports.find(
			report => report?.id === reportAttendanceId,
		)

		if (reportAttendances) setReportAttendances(reportAttendances)
	}

	function handleResolveConflict(conflictId: string) {
		setOpenConflictForm(true)
		const conflict = data.membersWithAttendancesConflicts.find(
			conflict => conflict?.id === conflictId,
		)
		if (conflict) {
			setAttendanceConflict(conflict)
		}
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

	// Handle view changes - load appropriate data when view changes
	useEffect(() => {
		if (view === 'REPORT_TRACKING') {
			const params = buildSearchParams(trackingFilterData)
			load(`${location.pathname}?${params}`)
		} else if (view === 'CONFLICTS') {
			const params = buildSearchParams(conflictFilterData)
			load(`${location.pathname}?${params}`)
		} else {
			const params = buildSearchParams(reportFilterData)
			load(`${location.pathname}?${params}`)
		}
	}, [
		view,
		load,
		location.pathname,
		trackingFilterData,
		conflictFilterData,
		reportFilterData,
	])

	const getCurrentFilterData = () => {
		if (view === 'REPORTS') return reportFilterData
		if (view === 'REPORT_TRACKING') return trackingFilterData
		return conflictFilterData
	}

	return {
		data,
		view,
		setView,
		openForm,
		setOpenForm,
		openConflictForm,
		openReportDetails,
		openFilterForm,
		setOpenFilterForm,
		reportAttendances,
		attendanceConflict,
		handleSeeDetails,
		setOpenReportDetails,
		handleOnFilter,
		reloadData,
		handleClose,
		handleResolveConflict,
		handleDisplayMore,
		handleSearch,
		reportSearchQuery,
		conflictSearchQuery,
		trackingSearchQuery,
		getCurrentFilterData,
	}
}
