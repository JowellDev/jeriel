import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { TribeTable } from './components/tribe-table'
import { useEffect, useState } from 'react'
import { TribeFormDialog } from './components/tribe-form-dialog'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine } from '@remixicon/react'
import { type MetaFunction } from '@remix-run/node'
import { loaderFn } from './loader.server'
import { useFetcher, useLoaderData, useSearchParams } from '@remix-run/react'
import { InputSearch } from '~/components/ui/input-search'
import { useDebounceCallback } from 'usehooks-ts'
import { type Tribe } from './types'
import { actionFn } from './action.server'

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
	const { tribes } = useLoaderData<typeof loaderFn>()
	const { load, ...fetcher } = useFetcher()

	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const handleSpeedDialItemClick = () => {
		setOpenTribeForm(true)
	}

	const handleClose = () => {
		setOpenTribeForm(false)
		load(`${location.pathname}?${searchParams}`)
	}

	const handleSearch = (searchQuery: string) => {
		debounced({ query: searchQuery })
	}

	useEffect(() => {
		load(`${location.pathname}?${searchParams}`)
	}, [load, searchParams])

	return (
		<MainContent
			headerChildren={
				<Header title="Tribus">
					<div className="hidden sm:block">
						<fetcher.Form>
							<InputSearch onSearch={handleSearch} placeholder="Recherche..." />
						</fetcher.Form>
					</div>
					<Button
						className="hidden sm:block"
						variant={'gold'}
						onClick={() => setOpenTribeForm(true)}
					>
						Créer une tribu
					</Button>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<Card className="space-y-2 pb-4 mb-2">
					<TribeTable data={tribes as unknown as Tribe[]} />
					<div className="flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>
			{openTribeForm && <TribeFormDialog onClose={handleClose} />}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
