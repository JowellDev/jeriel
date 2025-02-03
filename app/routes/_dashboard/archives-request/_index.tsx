import { useCallback, useEffect, useState } from 'react'
import {
	useLoaderData,
	useFetcher,
	useLocation,
	useSearchParams,
} from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import { RiGitPullRequestLine } from '@remixicon/react'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { TableToolbar } from '~/components/toolbar'
import { ArchiveFormDialog } from './components/archive-form-dialog'
import { ArchiveRequestTable } from './components/archive-request-table'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { buildSearchParams } from '~/utils/url'
import type { ArchiveRequest } from './model'
import type { FilterOption } from './schema'
import { loaderFn, type LoaderType } from './loader.server'
import { actionFn } from './action.server'

export const loader = loaderFn
export const action = actionFn

const SPEED_DIAL_ITEMS: SpeedDialAction[] = [
	{
		Icon: RiGitPullRequestLine,
		label: 'Faire une demande',
		action: 'request-an-archive',
	},
]

export default function ArchiveRequest() {
	const initialData = useLoaderData<typeof loader>()
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

	return (
		<MainContent
			headerChildren={
				<Header title="Demande d'archives">
					<Button
						className="hidden sm:block"
						variant="primary"
						onClick={() => setIsFormOpen(true)}
					>
						Faire une demande
					</Button>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<TableToolbar
					onSearch={handleSearch}
					searchContainerClassName="sm:w-1/3"
					align="end"
				/>

				<Card className="space-y-2 pb-4 mb-2">
					<ArchiveRequestTable data={data.archiveRequests} />

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
			</div>

			{isFormOpen && (
				<ArchiveFormDialog
					onClose={handleClose}
					authorizedEntities={data.authorizedEntities}
				/>
			)}

			<SpeedDialMenu
				items={SPEED_DIAL_ITEMS}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
