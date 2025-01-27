import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { TribeTable } from './components/tribe-table'
import { useCallback, useEffect, useState } from 'react'
import { TribeFormDialog } from './components/tribe-form-dialog'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine } from '@remixicon/react'
import { type MetaFunction } from '@remix-run/node'
import { type loaderData, loaderFn } from './loader.server'
import {
	useFetcher,
	useLoaderData,
	useLocation,
	useSearchParams,
} from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import { type Tribe } from './types'
import { actionFn } from './action.server'
import { TableToolbar } from '~/components/toolbar'
import { buildSearchParams } from '~/utils/url'
import { type FilterOption } from './schema'
import { FORM_INTENT } from './constants'
import { useDownloadFile } from '~/shared/hooks'

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Créer un tribu',
		action: 'add-tribe',
	},
]

export const meta: MetaFunction = () => [{ title: 'Gestion des tribus' }]

export const loader = loaderFn
export const action = actionFn

export default function Tribe() {
	const [openTribeForm, setOpenTribeForm] = useState(false)
	const loaderData = useLoaderData<typeof loader>()
	const [data, setData] = useState(loaderData)

	const { load, ...fetcher } = useFetcher<loaderData>()
	const [selectedTribe, setSelectedTribe] = useState<Tribe | undefined>(
		undefined,
	)
	const [isExporting, setIsExporting] = useState(false)
	const location = useLocation()
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	useDownloadFile({ ...fetcher, load }, { isExporting, setIsExporting })

	const reloadData = useCallback(
		(option: FilterOption) => {
			const params = buildSearchParams(option)
			load(`${location.pathname}?${params}`)
		},
		[load, location.pathname],
	)

	const handleSpeedDialItemClick = () => {
		setOpenTribeForm(true)
	}

	const handleClose = (reload: boolean) => {
		setOpenTribeForm(false)
		setSelectedTribe(undefined)

		if (reload) {
			reloadData({ ...data.filterOptions, page: 1 })
		}
	}

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			...data.filterOptions,
			query: searchQuery,
			page: 1,
		})
		debounced(params)
	}

	function handleEdit(tribe: Tribe) {
		setSelectedTribe(tribe)
		setOpenTribeForm(true)
	}

	function handleDisplayMore() {
		const option = data.filterOptions
		reloadData({ ...option, page: option.page + 1 })
	}

	function handleExport() {
		setIsExporting(true)
		fetcher.submit({ intent: FORM_INTENT.EXPORT_TRIBE }, { method: 'post' })
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
				<Header title="Tribus">
					<Button
						className="hidden sm:block"
						variant={'primary'}
						onClick={() => setOpenTribeForm(true)}
					>
						Ajouter
					</Button>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<TableToolbar
					onSearch={handleSearch}
					searchContainerClassName="sm:w-1/3"
					align="end"
					onExport={() => handleExport()}
					isExporting={isExporting}
					canExport={data.total > 0}
				/>
				<Card className="space-y-2 pb-4 mb-2">
					<TribeTable
						data={data.tribes as unknown as Tribe[]}
						onEdit={handleEdit}
					/>
					<div className="flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
							disabled={data.tribes?.length === data.total}
							onClick={handleDisplayMore}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>
			{openTribeForm && (
				<TribeFormDialog onClose={handleClose} tribe={selectedTribe} />
			)}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
