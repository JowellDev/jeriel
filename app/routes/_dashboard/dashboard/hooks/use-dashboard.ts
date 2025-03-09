import { useCallback, useEffect, useState } from 'react'
import { useFetcher, useSearchParams } from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import { buildSearchParams } from '~/utils/url'
import type { LoaderType } from '../loader.server'
import type { ViewOption } from '~/components/toolbar'
import type { SerializeFrom } from '@remix-run/node'
import type { DateRange } from 'react-day-picker'
import { startOfMonth } from 'date-fns'
import type { MemberFilterOptions } from '~/shared/types'

type LoaderReturnData = SerializeFrom<LoaderType>

export function useDashboard(loaderData: LoaderReturnData) {
	const [data, setData] = useState(loaderData)
	const [view, setView] = useState<ViewOption>('STAT')
	const [statView, setStatView] = useState<ViewOption>('CULTE')
	const [newView, setNewView] = useState<ViewOption>('STAT')
	const [searchParams, setSearchParams] = useSearchParams()
	const { load, ...fetcher } = useFetcher<LoaderType>()
	const debounced = useDebounceCallback(setSearchParams, 500)
	const [currentMonth, setCurrentMonth] = useState(new Date())

	const reloadData = useCallback(
		(data: MemberFilterOptions) => {
			const params = buildSearchParams(data)
			load(`${location.pathname}?${params}`)
		},
		[load],
	)

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			...data.filterData,
			query: searchQuery,
			page: 1,
		})
		debounced(params)
	}

	function handleOnPeriodChange(range: DateRange) {
		if (range.from && range.to) {
			const filterData = {
				...data?.filterData,
				from: range?.from?.toISOString(),
				to: range?.to?.toISOString(),
				page: 1,
			}

			setCurrentMonth(startOfMonth(range.to))
			reloadData(filterData)
		}
	}

	const handleEntitySelection = (entityId: string) => {
		const selectedEntity = data.entityStats.find(
			entity => entity?.id === entityId,
		)

		if (selectedEntity) {
			const filterData = {
				...data.filterData,
				entityType: selectedEntity.type,
				entityId: selectedEntity.id,
			}

			reloadData(filterData)
		}
	}

	function handleDisplayMore() {
		const option = data.filterData
		reloadData({ ...option, page: option.page + 1 })
	}

	const handleSpeedDialItemClick = (action: string) => {
		return true
	}

	useEffect(() => {
		load(`${location.pathname}?${searchParams}`)
	}, [load, searchParams])

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	function handleOnExport() {
		//
	}

	return {
		data,
		view,
		setView,
		statView,
		newView,
		setNewView,
		setStatView,
		handleSearch,
		handleOnExport,
		handleOnPeriodChange,
		handleEntitySelection,
		handleDisplayMore,
		handleSpeedDialItemClick,
		currentMonth,
		fetcher,
	}
}
