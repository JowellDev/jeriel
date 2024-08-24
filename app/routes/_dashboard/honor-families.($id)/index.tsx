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
import { RiArrowDownSLine } from '@remixicon/react'
import { Card } from '~/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { loaderData, loaderFn } from './loader.server'
import { actionFn } from './action.server'

export const meta: MetaFunction = () => [
	{ title: 'Gestion des familles d’honneur' },
]
export const loader = loaderFn
export const action = actionFn

export default function HonorFamily() {
	const { data } = useLoaderData<loaderData>()
	const { load, ...fetcher } = useFetcher()
	const [openManualForm, setOpenManualForm] = useState(false)

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const handleClose = () => {
		setOpenManualForm(false)
		load(`${location.pathname}?${searchParams}`)
	}

	const handleSearch = (searchQuery: string) => {
		debounced({ query: searchQuery })
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
					{/* <MemberTable
						data={data as unknown as MemberWithMonthlyAttendances[]}
					/> */}
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
			{/* {openManualForm && <MemberFormDialog onClose={handleClose} />} */}
			{/* <SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/> */}
		</MainContent>
	)
}
