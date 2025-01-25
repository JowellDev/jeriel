import { useEffect, useState } from 'react'
import { useFetcher, useSearchParams } from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import { buildSearchParams } from '~/utils/url'
import type { LoaderType } from '../loader.server'
import type { ViewOption } from '~/components/toolbar'
import type { SerializeFrom } from '@remix-run/node'

type LoaderReturnData = SerializeFrom<LoaderType>

export function useDashboard(loaderData: LoaderReturnData) {
	const [data, setData] = useState(loaderData)
	const [view, setView] = useState<ViewOption>('CULTE')
	const [searchParams, setSearchParams] = useSearchParams()
	const { load, ...fetcher } = useFetcher<LoaderType>()
	const debounced = useDebounceCallback(setSearchParams, 500)

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			console.log('data================>', fetcher.data)
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			...data.filterData,
			query: searchQuery,
			page: 1,
		})
		debounced(params)
	}

	useEffect(() => {
		load(`${location.pathname}?${searchParams}`)
	}, [load, searchParams])

	function handleOnExport() {
		//
	}

	return {
		data,
		view,
		setView,
		handleSearch,
		handleOnExport,
		fetcher,
	}
}
