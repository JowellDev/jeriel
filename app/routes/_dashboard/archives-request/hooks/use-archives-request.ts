import { useCallback, useEffect, useRef, useState } from 'react'
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
import type { ArchiveRequest } from '../model'
import { toast } from 'sonner'

export const useArchivesRequest = () => {
	const initialData = useLoaderData<LoaderType>()
	const [data, setData] = useState(initialData)
	const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
	const [editRequest, setEditRequest] = useState<ArchiveRequest | undefined>()
	const [requestToDelete, setRequestToDelete] = useState<
		ArchiveRequest | undefined
	>()

	const location = useLocation()
	const { load, submit, ...fetcher } = useFetcher<LoaderType>()
	const deleteFetcher = useFetcher<{ status: string }>()
	const [searchParams, setSearchParams] = useSearchParams()
	const debouncedSetSearchParams = useDebounceCallback(setSearchParams, 500)
	const isMounted = useRef(false)

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
		if (!isMounted.current) {
			isMounted.current = true
			return
		}
		if (searchParams.toString()) {
			load(`${location.pathname}?${searchParams.toString()}`)
		}
	}, [searchParams, location.pathname, load])

	useEffect(() => {
		if (
			deleteFetcher.state === 'idle' &&
			deleteFetcher.data?.status === 'success'
		) {
			toast.success('Demande supprimée avec succès.')
			setRequestToDelete(undefined)
			reloadData({ ...data.filterOption, page: 1 })
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [deleteFetcher.state, deleteFetcher.data])

	const handleClose = useCallback(() => {
		setIsFormOpen(false)
		setEditRequest(undefined)
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

	const handleEdit = useCallback((request: ArchiveRequest) => {
		setEditRequest(request)
		setIsFormOpen(true)
	}, [])

	const handleDeleteRequest = useCallback((request: ArchiveRequest) => {
		setRequestToDelete(request)
	}, [])

	const handleConfirmDelete = useCallback(() => {
		if (!requestToDelete?.id) return

		deleteFetcher.submit(
			{ intent: 'delete', requestId: requestToDelete.id },
			{ method: 'post', action: '.' },
		)
	}, [deleteFetcher, requestToDelete])

	const handleCancelDelete = useCallback(() => {
		setRequestToDelete(undefined)
	}, [])

	return {
		data,
		isFormOpen,
		editRequest,
		requestToDelete,
		setIsFormOpen,
		handleClose,
		handleDisplayMore,
		handleSearch,
		handleSpeedDialItemClick,
		handleEdit,
		handleDeleteRequest,
		handleConfirmDelete,
		handleCancelDelete,
	}
}
