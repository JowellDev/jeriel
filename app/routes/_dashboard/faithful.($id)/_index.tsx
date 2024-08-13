import { useState } from 'react'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { InputSearch } from '~/components/ui/input-search'
import { useFetcher, useSearchParams } from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine } from '@remixicon/react'

const speedDialItems: SpeedDialAction[] = [
	{ Icon: RiAddLine, label: 'Ajouter un fidèle', action: 'add-faithful' },
]

export default function Faithful() {
	const [openForm, setOpenForm] = useState(false)

	const fetcher = useFetcher()

	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const handleSearch = (searchQuery: string) => {
		debounced({ query: searchQuery })

		console.log(searchParams)
	}

	const handleSpeedDialItemClick = (action: string) => {
		if (action === 'add-faithful') setOpenForm(true)
	}

	return (
		<MainContent
			headerChildren={
				<Header title="Fidèles">
					<div className="hidden sm:block">
						<fetcher.Form>
							<InputSearch onSearch={handleSearch} placeholder="Recherche..." />
						</fetcher.Form>
					</div>
					<Button
						className="hidden sm:block"
						variant={'gold'}
						onClick={() => setOpenForm(true)}
					>
						Ajouter un fidèle
					</Button>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<fetcher.Form className="sm:hidden">
					<InputSearch onSearch={handleSearch} placeholder="Recherche..." />
				</fetcher.Form>
				<div>table</div>
			</div>
			{openForm && <div>form here</div>}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
