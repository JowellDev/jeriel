import type { SerializeFrom } from '@remix-run/node'
import type { LoaderType } from '../loader.server'
import { useFetcher, useLocation, useSearchParams } from '@remix-run/react'
import { useState, useCallback, useEffect } from 'react'
import { useDebounceCallback } from 'usehooks-ts'
import {} from '~/root'
import { buildSearchParams } from '~/utils/url'
import type { FilterOption } from '../schema'
import type { AttendanceReport } from '../model'
import { type ViewOption } from '~/components/toolbar'

type LoaderReturnData = SerializeFrom<LoaderType>

export const useReport = (initialData: LoaderReturnData) => {
	const [openForm, setOpenForm] = useState(false)
	const [data, setData] = useState(initialData)

	const { load, ...fetcher } = useFetcher<LoaderType>()
	const location = useLocation()

	const [openReportDetails, setOpenReportDetails] = useState<boolean>()

	const [searchParams, setSearchParams] = useSearchParams()
	const [reportAttendances, setReportAttendances] = useState<
		AttendanceReport | undefined
	>()

	const debounced = useDebounceCallback(setSearchParams, 500)

	const [view, setView] = useState<ViewOption>('REPORTS')

	const reloadData = useCallback(
		(option: FilterOption) => {
			const params = buildSearchParams(option)
			load(`${location.pathname}?${params}`)
		},
		[load, location.pathname],
	)

	const handleClose = () => {
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

	const handleSpeedDialItemClick = (action: string) => {
		//
	}

	function handleDisplayMore() {
		//
	}

	function handleSeeDetails(reportAttendanceId: string) {
		setOpenReportDetails(true)
		const reportAttendances = data.attendanceReports.find(
			report => report.id === reportAttendanceId,
		)
		setReportAttendances(reportAttendances)
	}

	function handleCloseDetails() {
		setOpenReportDetails(false)

		setReportAttendances(undefined)
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
		view,
		setView,
		openForm,
		setOpenForm,
		openReportDetails,
		reportAttendances,
		handleSeeDetails,
		setOpenReportDetails,
		handleCloseDetails,
		reloadData,
		handleClose,
		handleDisplayMore,
		handleSearch,
		handleSpeedDialItemClick,
	}
}
