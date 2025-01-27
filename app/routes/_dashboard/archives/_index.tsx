import { useCallback, useEffect, useState } from 'react'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { ArchiveFormDialog } from './components/archive-form-dialog'
import { ArchiveRequestTable } from './components/archive-request-table'
import { actionFn } from './action.server'
import type { ArchiveRequest } from './model'
import { loaderFn, type LoaderType } from './loader.server'
import {
	useFetcher,
	useLoaderData,
	useLocation,
	useSearchParams,
} from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine } from '@remixicon/react'
import { Card } from '~/components/ui/card'
import { type FilterOption } from './schema'
import { buildSearchParams } from '~/utils/url'
import { TableToolbar, type ViewOption } from '~/components/toolbar'
import { useApiData } from '../../../hooks/api-data.hook'
import type { GetAllMembersApiData } from '../../api/get-all-members/_index'
import { ArchivedUsersTable } from './components/archived-users-table'

export const loader = loaderFn
export const action = actionFn

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Ajouter un département',
		action: 'add-department',
	},
]

export default function ArchiveRequest() {
	const [openForm, setOpenForm] = useState(false)
	const [formMode, setFormMode] = useState<'request' | 'archive'>('archive')

	const [selectedRequest, setSelectedRequest] = useState<
		ArchiveRequest | undefined
	>(undefined)

	const loaderData = useLoaderData<typeof loader>()
	const [data, setData] = useState(loaderData)

	const [view, setView] = useState<ViewOption>('ARCHIVE_REQUEST')

	const { load, ...fetcher } = useFetcher<LoaderType>()

	const apiData = useApiData<GetAllMembersApiData>(
		'/api/get-all-members?isAdmin=false',
	)

	const location = useLocation()

	const [searchParams, setSearchParams] = useSearchParams()

	const debounced = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(option: FilterOption) => {
			const params = buildSearchParams(option)
			load(`${location.pathname}?${params}`)
		},
		[load, location.pathname],
	)

	const handleEdit = (value: ArchiveRequest) => {
		setSelectedRequest(value)
		setFormMode('archive')
		setOpenForm(true)
	}

	const handleClose = () => {
		setOpenForm(false)
		setSelectedRequest(undefined)
		reloadData({ ...data.filterOption, page: 1 })
	}

	const createRequest = () => {
		const users = apiData.data as unknown as any[]
		setSelectedRequest({ usersToArchive: users })
	}

	const handleOpenRequestArchive = () => {
		createRequest()
		setFormMode('request')
		setOpenForm(true)
	}

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			...data.filterOption,
			query: searchQuery,
			page: 1,
		})
		debounced(params)
	}

	const handleSpeedDialItemClick = (action: string) => {
		if (action === 'request-an-archive') {
			handleOpenRequestArchive()
		}
	}

	function handleDisplayMore() {
		const option = data.filterOption
		reloadData({ ...option, page: option.page + 1 })
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		if (searchParams.toString()) {
			load(`${location.pathname}?${searchParams.toString()}`)
		}
	}, [searchParams, location.pathname, load])

	const canRequest = data.currentUser.roles.some(role =>
		['DEPARTMENT_MANAGER', 'TRIBE_MANAGER', 'HONOR_FAMILY_MANAGER'].includes(
			role,
		),
	)

	return (
		<MainContent
			headerChildren={
				<Header title="Archives">
					{canRequest && (
						<Button
							className="hidden sm:block"
							variant={'primary'}
							onClick={() => handleOpenRequestArchive()}
						>
							Faire une demande
						</Button>
					)}
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<TableToolbar
					onSearch={handleSearch}
					searchContainerClassName="sm:w-1/3"
					align="end"
					onFilter={() => 2}
					view={view}
					setView={setView}
					views={[
						{ id: 'ARCHIVE_REQUEST', label: 'Demandes' },
						{ id: 'ARCHIVE', label: 'Archives' },
					]}
				/>
				{view === 'ARCHIVE_REQUEST' ? (
					<Card className="space-y-2 pb-4 mb-2">
						<ArchiveRequestTable
							data={data.archiveRequests}
							onEdit={handleEdit}
							canEdit={data.currentUser.roles.includes('ADMIN')}
						/>
						<div className="flex justify-center">
							<Button
								size="sm"
								type="button"
								variant="ghost"
								className="bg-neutral-200 rounded-full"
								disabled={data.archiveRequests.length === data.total}
								onClick={handleDisplayMore}
							>
								Voir plus
							</Button>
						</div>
					</Card>
				) : (
					<Card className="space-y-2 pb-4 mb-2">
						<ArchivedUsersTable data={data.archivedUsers} onEdit={() => 1} />
						<div className="flex justify-center">
							<Button
								size="sm"
								type="button"
								variant="ghost"
								className="bg-neutral-200 rounded-full"
								disabled={data.archiveRequests.length === data.total}
								onClick={handleDisplayMore}
							>
								Voir plus
							</Button>
						</div>
					</Card>
				)}
			</div>
			{openForm && selectedRequest && (
				<ArchiveFormDialog
					onClose={handleClose}
					archiveRequest={selectedRequest}
					mode={formMode}
				/>
			)}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
