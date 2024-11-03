import { useCallback, useEffect, useState } from 'react'
import type { LoaderType } from '../loader.server'
import { useFetcher, useSearchParams } from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import type { ServiceFilterOptions } from '../types'
import { buildSearchParams } from '~/utils/url'
import type { SerializeFrom } from '@remix-run/node'
import { speedDialItemsActions } from '../constants'

type LoaderReturnData = SerializeFrom<LoaderType>

export function useServices(loaderData: LoaderReturnData) {
	const [data, setData] = useState(loaderData)
	const { load, ...fetcher } = useFetcher<LoaderType>()

	const [openEditForm, setOpenEditForm] = useState(false)
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(data: ServiceFilterOptions) => {
			const params = buildSearchParams(data)
			load(`${location.pathname}?${params}`)
		},
		[load],
	)

	const handleClose = () => {
		setOpenEditForm(false)
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
		if (action === speedDialItemsActions.ADD_SERVICE) setOpenEditForm(true)
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
		openEditForm,
		handleClose,
		handleSearch,
		handleOnExport,
		setOpenEditForm,
		handleDisplayMore,
		handleSpeedDialItemClick,
	}
}
