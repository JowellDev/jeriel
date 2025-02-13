import { useCallback, useEffect, useState } from 'react'
import {
	useLoaderData,
	useFetcher,
	useLocation,
	useSearchParams,
	type MetaFunction,
} from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import { RiAddLine } from '@remixicon/react'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { TableToolbar, type ViewOption } from '~/components/toolbar'
import { ArchiveFormDialog } from './components/archive-form-dialog'
import { ArchiveRequestTable } from './components/archive-request-table'
import { ArchivedUsersTable } from './components/archived-users-table'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import { buildSearchParams } from '~/utils/url'
import { useApiData } from '../../../hooks/api-data.hook'
import type { GetAllMembersApiData } from '../../api/get-all-members/_index'
import type { ArchiveRequest } from './model'
import { loaderFn, type LoaderType } from './loader.server'
import { actionFn } from './action.server'

export const loader = loaderFn
export const action = actionFn

interface FormState {
	isOpen: boolean
	request: ArchiveRequest | undefined
}

const SPEED_DIAL_ITEMS = [
	{
		Icon: RiAddLine,
		label: 'Ajouter un département',
		action: 'add-department',
	},
]

const VIEWS = [
	{ id: 'ARCHIVE_REQUEST' as const, label: 'Demandes' },
	{ id: 'ARCHIVE' as const, label: 'Archives' },
]

export const meta: MetaFunction = () => [{ title: 'Gestion des archives' }]

export default function Archives() {
	const initialData = useLoaderData<typeof loader>()
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

	const onUnarchive = useCallback(
		(id: string) => {
			submit({ intent: 'unarchivate' }, { method: 'post', action: `./${id}` })
			setTimeout(() => {
				const params = buildSearchParams(data.filterOption)
				load(`${location.pathname}?${params}`)
			}, 100)
		},
		[submit, data.filterOption, load, location.pathname],
	)

	const hasMoreRequestsData = data.archiveRequests?.length < data.total
	const hasMoreArchives = data.archivedUsers?.length < data.totalArchivedUsers

	return (
		<MainContent headerChildren={<Header title="Archives" />}>
			<div className="flex flex-col gap-5">
				<TableToolbar
					onSearch={handleSearch}
					searchContainerClassName="sm:w-1/3"
					align="end"
					view={view}
					setView={setView}
					views={VIEWS}
				/>

				<Card className="space-y-2 pb-4 mb-2">
					{view === 'ARCHIVE_REQUEST' ? (
						<>
							<ArchiveRequestTable
								data={data.archiveRequests}
								onEdit={handleEdit}
							/>

							{hasMoreRequestsData && (
								<div className="flex justify-center">
									<Button
										size="sm"
										variant="ghost"
										className="bg-neutral-200 rounded-full"
										onClick={handleLoadMore}
									>
										Voir plus
									</Button>
								</div>
							)}
						</>
					) : (
						<>
							<ArchivedUsersTable
								data={data.archivedUsers}
								onUnarchive={onUnarchive}
							/>
							{hasMoreArchives && (
								<div className="flex justify-center">
									<Button
										size="sm"
										variant="ghost"
										className="bg-neutral-200 rounded-full"
										onClick={handleLoadMore}
									>
										Voir plus
									</Button>
								</div>
							)}
						</>
					)}
				</Card>
			</div>

			{formState.isOpen && formState.request && (
				<ArchiveFormDialog
					onClose={handleClose}
					archiveRequest={formState.request}
				/>
			)}

			<SpeedDialMenu
				items={SPEED_DIAL_ITEMS}
				onClick={action => {
					if (action === 'request-an-archive') handleOpenRequestArchive()
				}}
			/>
		</MainContent>
	)
}
