import type { NotificationFilter } from '../types'
import { useCallback, useEffect, useState } from 'react'
import {
	useFetcher,
	useLoaderData,
	useLocation,
	useSearchParams,
} from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import { type FilterOption } from '../schema'
import { buildSearchParams } from '~/utils/url'

import { loaderFn } from '../loader.server'

export const loader = loaderFn

export const useNotifications = () => {
	const initialData = useLoaderData<typeof loaderFn>()
	const [data, setData] = useState(initialData)
	const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all')

	const location = useLocation()
	const { load, ...fetcher } = useFetcher<typeof loaderFn>()
	const [searchParams, setSearchParams] = useSearchParams()
	const debouncedSetSearchParams = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(option: FilterOption) => {
			const params = buildSearchParams(option)
			load(`${location.pathname}?${params}`)
		},
		[load, location.pathname],
	)

	const filterNotifications = (filterType: NotificationFilter) => {
		setActiveFilter(filterType)
		const option = data.filterData
		reloadData({
			...option,
			filter: filterType,
			page: 1,
			query: '',
		})
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		if (searchParams.toString()) {
			load(`${location.pathname}?${searchParams.toString()}`)
		}
	}, [searchParams, location.pathname, load])

	const handleDisplayMore = useCallback(() => {
		const option = data.filterData
		reloadData({
			...option,
			page: option.page + 1,
			query: '',
		})
	}, [data.filterData, reloadData])

	const handleSearch = useCallback(
		(searchQuery: string) => {
			const params = buildSearchParams({
				...data.filterData,
				query: searchQuery,
				page: 1,
			})
			debouncedSetSearchParams(params)
		},
		[data.filterData, debouncedSetSearchParams],
	)

	return {
		data,
		activeFilter,
		filterNotifications,
		handleDisplayMore,
		handleSearch,
	}
}
