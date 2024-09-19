import {
	type MetaFunction,
	useFetcher,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react'
import { useCallback, useState } from 'react'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { InputSearch } from '~/components/form/input-search'
import { useDebounceCallback } from 'usehooks-ts'
import { Card } from '~/components/ui/card'
import { LoaderData, loaderFn } from './loader.server'
import { MemberWithMonthlyAttendances, Views } from './types'
import SpeedDialMenu, {
	SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine, RiFileExcel2Line } from '@remixicon/react'
import { SelectInput } from '~/components/form/select-input'
import { HonorFamilyHeader } from './components/header'
import {
	DEFAULT_QUERY_TAKE,
	stateFilterData,
	statusFilterData,
} from './constants'
import { HonorFamilyMembersTable } from './components/table'

type Keys = keyof typeof Views

const speedDialItemsActions = {
	ADD_MEMBER: 'add-member',
	SHOW_FILTER: 'show-filter',
}

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Créer un fidèle',
		action: speedDialItemsActions.ADD_MEMBER,
	},
]

export const meta: MetaFunction = () => [
	{ title: 'Membres de la famille d’honneur' },
]

export const loader = loaderFn
// export const action = actionFn

export default function HonorFamily() {
	const { honorFamily, take } = useLoaderData<LoaderData>()
	const { load, ...fetcher } = useFetcher()
	const [searchData, setSearchData] = useState('')
	const [view, setView] = useState<(typeof Views)[Keys]>(Views.CULTE)
	// const [statView, setStatView] = useState<(typeof Views)[Keys]>(Views.CULTE)

	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(take: number, query: string, state: string) => {
			setSearchParams(
				new URLSearchParams({
					take: take.toString(),
					query,
					state,
				}),
			)
			load(`${location.pathname}?${searchParams}`)
		},
		[load, searchParams, setSearchParams],
	)

	const handleSpeedDialItemClick = (action: string) => {
		if (action === speedDialItemsActions.ADD_MEMBER) return true
	}

	const handleSearch = (value: string) => {
		setSearchData(value)
		debounced({ query: value.trim() })
	}

	function handleStateChange(state: string) {
		reloadData(take, searchData, state)
	}

	const handleShowMoreTableData = () => {
		debounced({ query: searchData, take: `${take + 4}` })
	}

	return (
		<MainContent
			headerChildren={
				<HonorFamilyHeader
					returnLink="/honor-families"
					name={honorFamily.name}
					membersCount={honorFamily._count.members}
					managerName={honorFamily.manager.name}
					view={view}
					setView={setView}
				>
					{(view === 'culte' || view === 'service') && (
						<div className="hidden sm:block">
							<SelectInput items={statusFilterData} placeholder="Statut" />
						</div>
					)}
					{(view === 'culte' || view === 'service') && (
						<div className="hidden sm:block">
							<SelectInput
								items={stateFilterData}
								onChange={handleStateChange}
								placeholder="Etat"
							/>
						</div>
					)}
					{(view === 'culte' || view === 'service') && (
						<div className="hidden sm:block">
							<fetcher.Form>
								<InputSearch
									onSearch={handleSearch}
									placeholder="Rechercher un utilisateur"
								/>
							</fetcher.Form>
						</div>
					)}
					<div className="hidden sm:block">
						<Button variant={'outline'}>
							<RiFileExcel2Line className="w-4 h-4" /> Exporter
						</Button>
					</div>
					{(view === 'culte' || view === 'service') && (
						<Button className="hidden sm:block" variant={'gold'}>
							Créer un fidèle
						</Button>
					)}
				</HonorFamilyHeader>
			}
		>
			{(view === 'culte' || view === 'service') && (
				<Card className="space-y-2 pb-4 mb-2">
					<HonorFamilyMembersTable
						data={
							honorFamily.members as unknown as MemberWithMonthlyAttendances[]
						}
					/>
					{honorFamily._count.members > DEFAULT_QUERY_TAKE && (
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
			)}

			{view === 'stat' && <div>honor family stats</div>}

			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
