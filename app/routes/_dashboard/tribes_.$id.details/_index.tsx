import { MainContent } from '~/components/layout/main-content'
import { TribeHeader } from './components/tribe-header'
import { Button } from '~/components/ui/button'
import { loaderFn } from './loader.server'
import {
	type MetaFunction,
	useLoaderData,
	useFetcher,
	useSearchParams,
} from '@remix-run/react'
import { Card } from '~/components/ui/card'
import { TribeMemberTable } from './components/tribe-member-table'
import { type MemberWithMonthlyAttendances, Views } from './types'
import { InputSearch } from '~/components/ui/input-search'
import { useDebounceCallback } from 'usehooks-ts'
import { RiAddLine, RiFileExcel2Line } from '@remixicon/react'
import { SelectInput } from '~/components/form/select-input'
import {
	DEFAULT_QUERY_TAKE,
	stateFilterData,
	statusFilterData,
} from './constants'
import { useCallback, useState } from 'react'
import { TribeStatistics } from './components/statistics/tribe-statistics'
import { StatHeader } from './components/statistics/stat-header'
import { StatTable } from './components/statistics/stat-table'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'

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

export const meta: MetaFunction = () => [{ title: 'Gestion des Tribus' }]

export const loader = loaderFn

export default function TribeDetails() {
	const { tribe, count, take, membersCount } = useLoaderData<typeof loader>()
	const { load, ...fetcher } = useFetcher()
	const [searchData, setSearchData] = useState('')
	const [view, setView] = useState<(typeof Views)[Keys]>(Views.CULTE)
	const [statView, setStatView] = useState<(typeof Views)[Keys]>(Views.CULTE)

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
				<TribeHeader
					returnLink="/tribes"
					name={tribe.name}
					membersCount={membersCount}
					managerName={tribe.manager.name}
					view={view}
					setView={setView}
				>
					{(view === 'culte' || view === 'service') && (
						<div className="hidden sm:block">
							<SelectInput
								items={statusFilterData}
								size="md"
								testId="filter-state"
								placeholder="Statut"
							/>
						</div>
					)}
					{(view === 'culte' || view === 'service') && (
						<div className="hidden sm:block">
							<SelectInput
								items={stateFilterData}
								onChange={handleStateChange}
								size="md"
								testId="filter-state"
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
				</TribeHeader>
			}
		>
			{(view === 'culte' || view === 'service') && (
				<Card className="space-y-2 pb-4 mb-2">
					<TribeMemberTable
						data={tribe.members as unknown as MemberWithMonthlyAttendances[]}
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
			)}

			{view === 'stat' && (
				<div className="space-y-4">
					<TribeStatistics />

					<StatHeader
						title="Suivi des nouveaux fidèles"
						view={statView}
						setView={setStatView}
					>
						<div className="hidden sm:block">
							<fetcher.Form>
								<InputSearch
									onSearch={handleSearch}
									placeholder="Rechercher un utilisateur"
								/>
							</fetcher.Form>
						</div>
						<div className="hidden sm:block">
							<Button variant={'outline'}>
								<RiFileExcel2Line className="w-4 h-4" /> Exporter
							</Button>
						</div>
					</StatHeader>

					{(statView === 'culte' || statView === 'service') && (
						<StatTable
							data={tribe.members as unknown as MemberWithMonthlyAttendances[]}
						/>
					)}
				</div>
			)}

			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
