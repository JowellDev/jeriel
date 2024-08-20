import { useState } from 'react'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { InputSearch } from '~/components/ui/input-search'
import {
	type MetaFunction,
	useFetcher,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine } from '@remixicon/react'
import { FairthfulTable } from './components/fairthful-table'
import { loaderFn } from './loader.server'
import type { FairthfulWithMonthlyAttendances } from './types'
import { Card } from '~/components/ui/card'

export const meta: MetaFunction = () => [{ title: 'Gestion des fidèles' }]

const speedDialItems: SpeedDialAction[] = [
	{ Icon: RiAddLine, label: 'Ajouter un fidèle', action: 'add-faithful' },
]

export const loader = loaderFn

export default function Faithful() {
	const { data } = useLoaderData<typeof loaderFn>()
	const fetcher = useFetcher()
	const [openForm, setOpenForm] = useState(false)

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const handleSearch = (searchQuery: string) => {
		debounced({ query: searchQuery })
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
				<div>
					<Card className="space-y-2 pb-4">
						<FairthfulTable
							data={data as unknown as FairthfulWithMonthlyAttendances[]}
						/>
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
			</div>
			{openForm && <div>form here</div>}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
