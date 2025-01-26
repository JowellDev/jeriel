import { type SerializeFrom } from '@remix-run/node'
import { type loaderData } from '../loader.server'
import { useFetcher, useSearchParams } from '@remix-run/react'
import { useCallback, useEffect, useState } from 'react'
import type { MemberFilterOptions, SelectInputData } from '../types'
import { useDebounceCallback } from 'usehooks-ts'
import { buildSearchParams } from '~/utils/url'
import { createOptions, filterUniqueOptions } from '../utils'
import { speedDialItemsActions } from '../constants'
import { type ViewOption } from '~/components/toolbar'
import type { Member } from '~/models/member.model'

type LoaderReturnData = SerializeFrom<loaderData>

export const useTribeDetails = (initialData: LoaderReturnData) => {
	const [data, setData] = useState(initialData)
	const { load, ...fetcher } = useFetcher<loaderData>()

	const [view, setView] = useState<ViewOption>('CULTE')
	const [statView, setStatView] = useState<ViewOption>('CULTE')

	const [membersOption, setMembersOption] = useState<SelectInputData[]>([])
	const [openManualForm, setOpenManualForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openAssistantForm, setOpenAssistantForm] = useState(false)
	const [openFilterForm, setOpenFilterForm] = useState(false)
	const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>()
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

	const handleFilterChange = useCallback(
		(options: {
			state?: string
			status?: string
			from?: string
			to?: string
		}) => {
			if (options.from && options.to) {
				setDateRange({ from: options.from, to: options.to })
				const newFilterData = {
					...data.filterData,
					...options,
					page: 1,
					from: options.from,
					to: options.to,
				}

				reloadData(newFilterData)
			}
		},
		[data.filterData, reloadData],
	)

	function onExport() {
		//
	}

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

	return {
		data,
		view,
		setView,
		statView,
		setStatView,
		dateRange,
		membersOption,
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
		openFilterForm,
		setOpenFilterForm,
		handleClose,
		onExport,
	}
}
