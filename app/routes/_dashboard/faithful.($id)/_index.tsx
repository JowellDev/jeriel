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
import { RiAddLine, RiArrowDownSLine } from '@remixicon/react'
import { FairthfulTable } from './components/fairthful-table'
import { loaderFn } from './loader.server'
import type { FairthfulWithMonthlyAttendances } from './types'
import { Card } from '~/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

export const meta: MetaFunction = () => [{ title: 'Gestion des fidèles' }]

const speedDialItems: SpeedDialAction[] = [
	{ Icon: RiAddLine, label: 'Ajouter un fidèle', action: 'add-faithful' },
]

export const loader = loaderFn

export default function Faithful() {
	const { data } = useLoaderData<typeof loaderFn>()
	const fetcher = useFetcher()
	const [openManualForm, setOpenManualForm] = useState(false)

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const handleSearch = (searchQuery: string) => {
		debounced({ query: searchQuery })
	}

	const handleSpeedDialItemClick = (action: string) => {
		if (action === 'add-faithful') setOpenManualForm(true)
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
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button className="hidden sm:flex items-center" variant={'gold'}>
								<span>Ajouter un fidèle</span>
								<RiArrowDownSLine size={20} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="mr-3 ">
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => setOpenManualForm(true)}
							>
								Ajouter manuellement
							</DropdownMenuItem>
							<DropdownMenuItem className="cursor-pointer">
								Importer un fichier
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<fetcher.Form className="sm:hidden">
					<InputSearch onSearch={handleSearch} placeholder="Recherche..." />
				</fetcher.Form>
				<Card className="space-y-2 pb-4 mb-2">
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
			{openManualForm && <div>form here</div>}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
