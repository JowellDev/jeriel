import { useCallback, useEffect, useState } from 'react'
import type { LoaderType } from '../server/loader.server'
import {
	useFetcher,
	type useLoaderData,
	useSearchParams,
} from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import type { ServiceData, ServiceFilterOptions } from '../types'
import { buildSearchParams } from '~/utils/url'
import { speedDialItemsActions } from '../constants'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'

type LoaderReturnData = ReturnType<typeof useLoaderData<LoaderType>>

export function useServices(loaderData: LoaderReturnData) {
	const [data, setData] = useState(loaderData)
	const { load, ...fetcher } = useFetcher<LoaderType>()

	const [openEditForm, setOpenEditForm] = useState(false)
	const [openConfirmForm, setOpenConfirmForm] = useState(false)
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)
	const [selectedService, setSelectedService] = useState<
		ServiceData | undefined
	>()

	const reloadData = useCallback(
		(data: ServiceFilterOptions) => {
			const params = buildSearchParams(data)
			load(`${location.pathname}?${params}`)
		},
		[load],
	)

	const handleOnEdit = useCallback(
		(service: ServiceData) => {
			setSelectedService(service)
			setOpenEditForm(true)
		},
		[setSelectedService, setOpenEditForm],
	)

	const handleOnDelete = useCallback(
		(service: ServiceData) => {
			setSelectedService(service)
			setOpenConfirmForm(true)
		},
		[setSelectedService, setOpenConfirmForm],
	)

	const handleOnClose = useCallback(() => {
		setOpenEditForm(false)
		setOpenConfirmForm(false)
		setSelectedService(undefined)
		reloadData({ ...data.filterData, page: 1 })
	}, [data, reloadData, setOpenEditForm])

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
		reloadData({
			...filterData,
			take: filterData.take + DEFAULT_QUERY_TAKE,
		})
	}

	function handleOnExport() {}

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
		selectedService,
		openConfirmForm,
		handleOnClose,
		handleSearch,
		handleOnEdit,
		handleOnExport,
		handleOnDelete,
		setOpenEditForm,
		handleDisplayMore,
		handleSpeedDialItemClick,
	}
}
