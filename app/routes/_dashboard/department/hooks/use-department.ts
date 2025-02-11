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
import { startOfMonth } from 'date-fns'

type LoaderReturnData = SerializeFrom<LoaderType>

export const useDepartment = (initialData: LoaderReturnData) => {
	const [data, setData] = useState(initialData)
	const { load, ...fetcher } = useFetcher<LoaderType>()
	const [searchParams, setSearchParams] = useSearchParams()

	const [view, setView] = useState<ViewOption>('CULTE')

	const [membersOption, setMembersOption] = useState<Option[]>([])
	const [openManualForm, setOpenManualForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openAssistantForm, setOpenAssistantForm] = useState(false)
	const [openFilterForm, setOpenFilterForm] = useState(false)
	const [openAttendanceForm, setOpenAttendanceForm] = useState(false)
	const [currentMonth, setCurrentMonth] = useState(new Date())

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
		setOpenAttendanceForm(false)
		reloadData({ ...data.filterData, page: 1 })
	}, [data.filterData, reloadData])

	const handleExport = useCallback(() => {
		//
	}, [])

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
		const uniqueOptions = getUniqueOptions(
			data.membersAttendances,
			data.assistants,
		)
		setMembersOption(uniqueOptions)
	}, [data.membersAttendances, data.assistants])

	return {
		data,
		view,
		currentMonth,
		membersOption,
		openManualForm,
		openUploadForm,
		openFilterForm,
		openAssistantForm,
		openAttendanceForm,
		setView,
		handleClose,
		handleExport,
		handleSearch,
		setOpenManualForm,
		setOpenFilterForm,
		setOpenUploadForm,
		handleFilterChange,
		setOpenAssistantForm,
		setOpenAttendanceForm,
		handleShowMoreTableData,
	}
}
