import { useEffect, useState } from 'react'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { InputSearch } from '~/components/form/input-search'
import { ChurchesFormDialog } from './components/churches-form-dialog'
import { ChurchTable } from './components/churches-table'
import { actionFn } from './action.server'
import type { Church } from './model'
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

export const loader = loaderFn
export const action = actionFn

const speedDialItems: SpeedDialAction[] = [
	{ Icon: RiAddLine, label: 'Ajouter une église', action: 'add-church' },
]

export default function Church() {
	const [openForm, setOpenForm] = useState(false)
	const [selectedChurch, setSelectedChurch] = useState<Church | undefined>(
		undefined,
	)
	const { churches, query } = useLoaderData<typeof loader>()
	const { load, ...fetcher } = useFetcher<LoaderType>()
	const location = useLocation()
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const handleEdit = (church: Church) => {
		setSelectedChurch(church)
		setOpenForm(true)
	}

	const handleClose = () => {
		setOpenForm(false)
		setSelectedChurch(undefined)
		load(`${location.pathname}?${searchParams}`)
	}

	const handleSearch = (searchQuery: string) => {
		debounced({ query: searchQuery })
	}

	const handleSpeedDialItemClick = (action: string) => {
		if (action === 'add-church') setOpenForm(true)
	}

	useEffect(() => {
		if (searchParams.toString()) {
			load(`${location.pathname}?${searchParams.toString()}`)
		}
	}, [searchParams, location.pathname, load])

	return (
		<MainContent
			headerChildren={
				<Header title="Gestion d'églises">
					<div className="hidden sm:block">
						<fetcher.Form>
							<InputSearch
								defaultValue={query}
								onSearch={handleSearch}
								placeholder="Recherche..."
							/>
						</fetcher.Form>
					</div>
					<Button
						className="hidden sm:block"
						variant={'gold'}
						onClick={() => setOpenForm(true)}
					>
						Ajouter une église
					</Button>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<fetcher.Form className="sm:hidden">
					<InputSearch
						defaultValue={query}
						onSearch={handleSearch}
						placeholder="Recherche..."
					/>
				</fetcher.Form>
				<ChurchTable
					data={fetcher.data?.churches || churches}
					onEdit={handleEdit}
				/>
			</div>
			{openForm && (
				<ChurchesFormDialog onClose={handleClose} church={selectedChurch} />
			)}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
