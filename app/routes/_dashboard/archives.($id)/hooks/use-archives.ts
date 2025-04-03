import { useCallback, useEffect, useState } from 'react'
import {
	useLoaderData,
	useFetcher,
	useLocation,
	useSearchParams,
} from '@remix-run/react'
import { type ViewOption } from '~/components/toolbar'
import { buildSearchParams } from '~/utils/url'
import { useApiData } from '~/hooks/api-data.hook'
import type { ArchiveRequest, User } from '../model'
import { type LoaderType } from '../loader.server'
import type { GetAllMembersApiData } from '~/routes/api/get-all-members/_index'
import { useDebounceCallback } from 'usehooks-ts'

interface FormState {
	isOpen: boolean
	request: ArchiveRequest | undefined
}
export const useArchives = () => {
	const initialData = useLoaderData<LoaderType>()
	const [data, setData] = useState(initialData)
	const [view, setView] = useState<ViewOption>('ARCHIVE_REQUEST')
	const [formState, setFormState] = useState<FormState>({
		isOpen: false,
		request: undefined,
	})

	const location = useLocation()
	const { load, submit, ...fetcher } = useFetcher<LoaderType>()
	const [searchParams, setSearchParams] = useSearchParams()
	const debouncedSetSearchParams = useDebounceCallback(setSearchParams, 500)
	const { data: usersData } = useApiData<GetAllMembersApiData>(
		'/api/get-all-members',
	)
	const [selectedUser, setSelectedUser] = useState<User | undefined>()
	const [openConfirmForm, setOpenConfirmForm] = useState(false)

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		const params = searchParams.toString()
		if (params) {
			load(`${location.pathname}?${params}`)
		}
	}, [searchParams, location.pathname, load])

	const handleEdit = useCallback((request: ArchiveRequest) => {
		setFormState({ isOpen: true, request })
	}, [])

	const handleClose = useCallback(() => {
		setFormState({ isOpen: false, request: undefined })
		const params = buildSearchParams({ ...data.filterOption, page: 1 })
		load(`${location.pathname}?${params}`)
	}, [data.filterOption, load, location.pathname])

	const handleOpenRequestArchive = useCallback(() => {
		if (!usersData) return
		setFormState({
			isOpen: true,
			request: { usersToArchive: usersData as unknown as any[] },
		})
	}, [usersData])

	const handleSearch = useCallback(
		(query: string) => {
			const params = buildSearchParams({
				...data.filterOption,
				query,
				page: 1,
			})
			debouncedSetSearchParams(params)
		},
		[data.filterOption, debouncedSetSearchParams],
	)

	const handleLoadMore = useCallback(() => {
		const params = buildSearchParams({
			...data.filterOption,
			page: data.filterOption.page + 1,
		})
		load(`${location.pathname}?${params}`)
	}, [data.filterOption, load, location.pathname])

	const handleOnUnarchive = useCallback(
		(user: User) => {
			setSelectedUser(user)
			setOpenConfirmForm(true)
		},
		[setSelectedUser, setOpenConfirmForm],
	)

	const handleOnClose = useCallback(() => {
		setOpenConfirmForm(false)
		setSelectedUser(undefined)
		const params = buildSearchParams(data.filterOption)
		load(`${location.pathname}?${params}`)
	}, [data.filterOption, load, location.pathname])

	return {
		data,
		view,
		setView,
		formState,
		usersData,
		selectedUser,
		openConfirmForm,
		handleClose,
		handleOnClose,
		handleLoadMore,
		handleEdit,
		handleOnUnarchive,
		handleOpenRequestArchive,
		handleSearch,
	}
}
