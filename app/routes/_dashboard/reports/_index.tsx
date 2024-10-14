import { useCallback, useEffect, useState } from 'react'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { ArchiveFormDialog } from './components/report-form-dialog'
import { ReportTable } from './components/report-table'
import { actionFn } from './action.server'
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

export const loader = loaderFn
export const action = actionFn

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Ajouter un département',
		action: 'add-department',
	},
]

export default function Report() {
	const [openForm, setOpenForm] = useState(false)

	const loaderData = useLoaderData<typeof loader>()
	const [data, setData] = useState(loaderData)

	const [view, setView] = useState<ViewOption>('ARCHIVE_REQUEST')

	const { load, ...fetcher } = useFetcher<LoaderType>()
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

	const handleClose = () => {
		setOpenForm(false)
		reloadData({ ...data.filterOption, page: 1 })
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
		if (action === 'add-department') setOpenForm(true)
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

	return (
		<MainContent
			headerChildren={
				<Header title="Rapports">
					<Button className="hidden sm:block" variant={'gold'}>
						Résoudre les conflits
					</Button>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<TableToolbar
					onSearch={handleSearch}
					searchContainerClassName="sm:w-1/3"
					align="end"
					onFilter={() => 2}
					onExport={() => 2}
				/>
				<Card className="space-y-2 pb-4 mb-2">
					<ReportTable data={[]} />
					<div className="flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
							// disabled={data.items.length === data.total}
							onClick={handleDisplayMore}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>
			{openForm && <ArchiveFormDialog onClose={handleClose} />}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
