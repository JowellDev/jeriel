import { useCallback, useEffect, useState } from 'react'
import {
	useLoaderData,
	useFetcher,
	useLocation,
	useSearchParams,
} from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import { buildSearchParams } from '~/utils/url'
import type { FilterOption } from '../schema'
import { type LoaderType } from '../loader.server'

export const useArchivesRequest = () => {
	const initialData = useLoaderData<LoaderType>()
	const [data, setData] = useState(initialData)
	const [isFormOpen, setIsFormOpen] = useState<boolean>(false)

	const location = useLocation()
	const { load, ...fetcher } = useFetcher<LoaderType>()
	const [searchParams, setSearchParams] = useSearchParams()
	const debouncedSetSearchParams = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(option: FilterOption) => {
			const params = buildSearchParams(option)
			load(`${location.pathname}?${params}`)
		},
		[load, location.pathname],
	)

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

	const handleClose = useCallback(() => {
		setIsFormOpen(false)
		reloadData({ ...data.filterOption, page: 1 })
	}, [data.filterOption, reloadData])

	const handleSearch = useCallback(
		(searchQuery: string) => {
			const params = buildSearchParams({
				...data.filterOption,
				query: searchQuery,
				page: 1,
			})
			debouncedSetSearchParams(params)
		},
		[data.filterOption, debouncedSetSearchParams],
	)

	const handleDisplayMore = useCallback(() => {
		const option = data.filterOption
		reloadData({ ...option, page: option.page + 1 })
	}, [data.filterOption, reloadData])

	const handleSpeedDialItemClick = (action: string) => {
		if (action === 'request-an-archive') {
			setIsFormOpen(true)
		}
	}

	return {
		data,
		isFormOpen,
		setIsFormOpen,
		handleClose,
		handleDisplayMore,
		handleSearch,
		handleSpeedDialItemClick,
	}
}
