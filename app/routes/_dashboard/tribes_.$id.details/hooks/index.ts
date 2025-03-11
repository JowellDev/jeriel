import { type SerializeFrom } from '@remix-run/node'
import { type loaderData } from '../loader.server'
import { useFetcher, useSearchParams } from '@remix-run/react'
import { useCallback, useEffect, useState } from 'react'
import type {
	MemberFilterOptions,
	MembersStats,
	SelectInputData,
} from '../types'
import { useDebounceCallback } from 'usehooks-ts'
import { buildSearchParams } from '~/utils/url'
import { createOptions, filterUniqueOptions } from '../utils'
import { speedDialItemsActions } from '../constants'
import { type ViewOption } from '~/components/toolbar'
import type { Member } from '~/models/member.model'
import { MemberStatus } from '~/shared/enum'
import { endOfMonth, startOfMonth } from 'date-fns'
import { type DateRange } from 'react-day-picker'

type LoaderReturnData = SerializeFrom<loaderData>

export const useTribeDetails = (initialData: LoaderReturnData) => {
	const [data, setData] = useState(initialData)
	const { load, ...fetcher } = useFetcher<loaderData>()
	const {
		load: statLoad,
		data: memberStats,
		...statFetcher
	} = useFetcher<{
		oldMembersStats: MembersStats[]
		newMembersStats: MembersStats[]
	}>()

	const [view, setView] = useState<ViewOption>('CULTE')
	const [statView, setStatView] = useState<ViewOption>('CULTE')
	const [currentMonth, setCurrentMonth] = useState(new Date())

	const [membersOption, setMembersOption] = useState<SelectInputData[]>([])
	const [openManualForm, setOpenManualForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openAssistantForm, setOpenAssistantForm] = useState(false)
	const [openFilterForm, setOpenFilterForm] = useState(false)
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(data: MemberFilterOptions) => {
			const params = buildSearchParams({
				...data,
			})
			load(`${location.pathname}?${params}`)
		},
		[load],
	)

	const handleSpeedDialItemClick = (action: string) => {
		switch (action) {
			case speedDialItemsActions.ADD_MEMBER:
				return setOpenManualForm(true)
			case speedDialItemsActions.UPLOAD_MEMBERS:
				return setOpenUploadForm(true)

			default:
				break
		}
	}

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			...data.filterData,
			query: searchQuery,
			page: 1,
		})
		debounced(params)
	}

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
		(options: MemberFilterOptions) => {
			const newFilterData = {
				...data.filterData,
				...options,
				page: 1,
			}

			reloadData(newFilterData)
		},
		[data.filterData, reloadData],
	)

	function onExport() {
		//
	}

	const handleOnPeriodChange = useCallback(
		(range: DateRange) => {
			if (range.from && range.to) {
				statLoad(
					`/api/statistics?tribeId=${data.tribe.id}&from=${range.from.toISOString()}&to=${range.to.toISOString()}`,
				)
			}
		},
		[data.tribe.id, statLoad],
	)

	const handleShowMoreTableData = useCallback(() => {
		reloadData({ ...data.filterData, page: data.filterData.page + 1 })
	}, [data.filterData, reloadData])

	const handleClose = () => {
		setOpenManualForm(false)
		setOpenUploadForm(false)
		setOpenAssistantForm(false)
		reloadData({ ...data.filterData, page: 1 })
	}

	useEffect(() => {
		if (data?.filterData?.from && data?.filterData?.to) {
			setCurrentMonth(new Date(startOfMonth(data.filterData.to)))
		}
	}, [data?.filterData?.from, data?.filterData?.to])

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		load(`${location.pathname}?${searchParams}`)
	}, [load, searchParams])

	useEffect(() => {
		const members = createOptions(data.members as unknown as Member[])
		const assistants = createOptions(
			data.tribeAssistants as unknown as Member[],
		)
		const allOptions = [...members, ...assistants]
		const newFormOptions = filterUniqueOptions(allOptions)

		setMembersOption(newFormOptions)
	}, [data])

	useEffect(() => {
		if (view === 'STAT' && data?.tribe?.id)
			statLoad(
				`/api/statistics?tribeId=${data.tribe.id}&from=${startOfMonth(new Date()).toISOString()}&to=${endOfMonth(new Date()).toISOString()}`,
			)
	}, [data?.tribe?.id, statLoad, view])

	useEffect(() => {
		if (statFetcher.state === 'idle') {
			console.log('data===============', memberStats)
		}
	}, [memberStats])

	return {
		data,
		view,
		currentMonth,
		setView: handleViewChange,
		statView,
		setStatView,
		membersOption,
		memberStats,
		openManualForm,
		setOpenManualForm,
		openUploadForm,
		setOpenUploadForm,
		openAssistantForm,
		setOpenAssistantForm,
		handleSearch,
		handleFilterChange,
		handleShowMoreTableData,
		handleSpeedDialItemClick,
		handleOnPeriodChange,
		openFilterForm,
		setOpenFilterForm,
		handleClose,
		onExport,
	}
}
