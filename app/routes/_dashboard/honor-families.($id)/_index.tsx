import {
	type MetaFunction,
	useFetcher,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react'
import { useState } from 'react'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { useDebounceCallback } from 'usehooks-ts'
import { Card } from '~/components/ui/card'
import { HonorFamilyTable } from './components/table'
import { type loaderData, loaderFn } from './loader.server'
import { actionFn } from './action.server'
import { type HonorFamily as HonorFamilyData } from './types'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import { FORM_INTENT, speedDialItems, speedDialItemsActions } from './constants'
import { HonoreFamilyFormDialog } from './components/form-dialog'
import { TableToolbar } from '~/components/toolbar'
import { useDownloadFile } from '~/shared/hooks'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'

export const meta: MetaFunction = () => [
	{ title: 'Gestion des familles d’honneur' },
]
export const loader = loaderFn
export const action = actionFn

export default function HonorFamily() {
	const { honorFamilies, total, ...filterData } = useLoaderData<loaderData>()
	const [searchParams, setSearchParams] = useSearchParams()
	const [searchData, setSearchData] = useState(searchParams.get('query') ?? '')
	const fetcher = useFetcher<typeof actionFn>()
	const [openForm, setOpenForm] = useState(false)
	const [isExporting, setIsExporting] = useState(false)
	const [selectedHonorFamily, setSelectedHonorFamily] = useState<
		HonorFamilyData | undefined
	>(undefined)

	const debounced = useDebounceCallback(setSearchParams, 500)

	useDownloadFile(fetcher, { isExporting, setIsExporting })

	const handleClose = (shouldReloade: boolean) => {
		setOpenForm(false)
		setSelectedHonorFamily(undefined)

		if (shouldReloade) fetcher.load(`${location.pathname}?${searchParams}`)
	}

	const handleEdit = (honorFamilie: HonorFamilyData) => {
		setSelectedHonorFamily(honorFamilie)
		setOpenForm(true)
	}

	const handleSearch = (searchQuery: string) => {
		setSearchData(searchQuery)
		debounced({ query: searchQuery })
	}

	const handleSpeedDialItemClick = (action: string) => {
		if (action === speedDialItemsActions.CREATE_HONOR_FAMILY) setOpenForm(true)
	}

	const handleShowMoreTableData = () => {
		setSearchParams({
			query: searchData,
			take: `${filterData.take + DEFAULT_QUERY_TAKE}`,
		})
	}

	function handleExport(): void {
		setIsExporting(true)
		fetcher.submit({ intent: FORM_INTENT.EXPORT }, { method: 'post' })
	}

	return (
		<MainContent
			headerChildren={
				<Header title="Familles d’honneur">
					<Button
						className="hidden sm:flex items-center"
						variant={'primary'}
						onClick={() => setOpenForm(true)}
					>
						<span>Ajouter</span>
					</Button>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<TableToolbar
					onSearch={handleSearch}
					searchQuery={searchData}
					searchContainerClassName="sm:w-1/3"
					align="end"
					onExport={() => handleExport()}
					isExporting={isExporting}
					canExport={total > 0}
				/>

				<Card className="space-y-2 mb-2">
					<HonorFamilyTable
						data={honorFamilies as unknown as HonorFamilyData[]}
						onEdit={handleEdit}
					/>

					<div className="flex justify-center pb-2">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
							onClick={handleShowMoreTableData}
							disabled={filterData.take >= total}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>
			{openForm && (
				<HonoreFamilyFormDialog
					onClose={handleClose}
					honorFamily={selectedHonorFamily}
				/>
			)}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
