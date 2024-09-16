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
import { InputSearch } from '~/components/form/input-search'
import { useDebounceCallback } from 'usehooks-ts'
import { Card } from '~/components/ui/card'
import { HonorFamilyTable } from './components/table'
import { type loaderData, loaderFn } from './loader.server'
import { actionFn } from './action.server'
import { type HonorFamily as HonorFamilyData } from './types'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import {
	DEFAULT_QUERY_TAKE,
	speedDialItems,
	speedDialItemsActions,
} from './constants'
import { HonoreFamilyFormDialog } from './components/form-dialog'

export const meta: MetaFunction = () => [
	{ title: 'Gestion des familles d’honneur' },
]
export const loader = loaderFn
export const action = actionFn

export default function HonorFamily() {
	const { honorFamilies, count, take } = useLoaderData<loaderData>()
	const { load, ...fetcher } = useFetcher()
	const [openForm, setOpenForm] = useState(false)
	const [searchData, setSearchData] = useState('')
	const [selectedHonorFamily, setSelectedHonorFamily] = useState<
		HonorFamilyData | undefined
	>(undefined)

	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const handleClose = (shouldReloade: boolean) => {
		setOpenForm(false)
		setSelectedHonorFamily(undefined)

		if (shouldReloade) load(`${location.pathname}?${searchParams}`)
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
		debounced({ query: searchData, take: `${take + 25}` })
	}

	return (
		<MainContent
			headerChildren={
				<Header title="Familles d’honneur">
					<div className="hidden sm:block">
						<fetcher.Form>
							<InputSearch onSearch={handleSearch} placeholder="Recherche..." />
						</fetcher.Form>
					</div>
					<Button
						className="hidden sm:flex items-center"
						variant={'gold'}
						onClick={() => setOpenForm(true)}
					>
						<span>Créer une famille d’honneur</span>
					</Button>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<fetcher.Form className="sm:hidden">
					<InputSearch onSearch={handleSearch} placeholder="Recherche..." />
				</fetcher.Form>
				<Card className="space-y-2 pb-4 mb-2">
					<HonorFamilyTable
						data={honorFamilies as unknown as HonorFamilyData[]}
						onEdit={handleEdit}
					/>
					{count > DEFAULT_QUERY_TAKE && (
						<div className="flex justify-center">
							<Button
								size="sm"
								type="button"
								variant="ghost"
								className="bg-neutral-200 rounded-full"
								onClick={handleShowMoreTableData}
							>
								Voir plus
							</Button>
						</div>
					)}
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
