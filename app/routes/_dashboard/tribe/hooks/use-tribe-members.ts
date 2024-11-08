import { useCallback, useEffect, useState } from 'react'
import type { LoaderType } from '../loader.server'
import { useFetcher, useSearchParams } from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import type { MemberFilterOptions } from '../types'
import { buildSearchParams } from '~/utils/url'
import type { DateRange } from 'react-day-picker'
import { startOfMonth } from 'date-fns'
import type { SerializeFrom } from '@remix-run/node'

type LoaderReturnData = SerializeFrom<LoaderType>

export function useTribeMembers(loaderData: LoaderReturnData) {
	const [data, setData] = useState(loaderData)
	const { load, ...fetcher } = useFetcher<LoaderType>()

	const [openCreateForm, setOpenCreateForm] = useState(false)
	const [openFilterForm, setOpenFilterForm] = useState(false)
	const [currentMounth, setCurrentMonth] = useState(new Date())
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(data: MemberFilterOptions) => {
			const params = buildSearchParams(data)
			load(`${location.pathname}?${params}`)
		},
		[load],
	)

	const handleClose = () => {
		setOpenCreateForm(false)
		setOpenFilterForm(false)
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
		fetcher,
		openCreateForm,
		openFilterForm,
		currentMounth,
		handleSearch,
		handleDisplayMore,
		handleOnFilter,
		handleOnPeriodChange,
		handleOnExport,
		handleClose,
		setOpenCreateForm,
		setOpenFilterForm,
	}
}
