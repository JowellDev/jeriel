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
import { type MemberFilterOptions, Views } from './types'
import { useDebounceCallback } from 'usehooks-ts'
import { RiAddLine, RiFileExcel2Line } from '@remixicon/react'
import { SelectInput } from '~/components/form/select-input'
import { stateFilterData, statusFilterData } from './constants'
import { useCallback, useEffect, useState } from 'react'
import { TribeStatistics } from './components/statistics/tribe-statistics'
import { StatHeader } from './components/statistics/stat-header'
import { StatTable } from './components/statistics/stat-table'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { InputSearch } from '~/components/form/input-search'
import { buildSearchParams } from '~/utils/url'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { MemberFormDialog } from './components/member-form'
import { actionFn } from './action.server'

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

export const action = actionFn

export default function TribeDetails() {
	const loaderData = useLoaderData<typeof loader>()
	const [data, setData] = useState(loaderData)
	const { load, ...fetcher } = useFetcher<typeof loader>()

	const [view, setView] = useState<(typeof Views)[Keys]>(Views.CULTE)
	const [statView, setStatView] = useState<(typeof Views)[Keys]>(Views.CULTE)

	const [filters, setFilters] = useState({
		state: 'ALL',
		status: 'ALL',
	})

	const [openManualForm, setOpenManualForm] = useState(false)

	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(data: MemberFilterOptions) => {
			const params = buildSearchParams({
				...data,
				state: filters.state,
				status: filters.status,
			})
			load(`${location.pathname}?${params}`)
		},
		[load, filters],
	)

	const handleSpeedDialItemClick = (action: string) => {
		if (action === speedDialItemsActions.ADD_MEMBER)
			return setOpenManualForm(true)
	}

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			...data.filterData,
			query: searchQuery,
			page: 1,
		})
		debounced(params)
	}

	const handleFilterChange = (
		filterType: 'state' | 'status',
		value: string,
	) => {
		setFilters(prev => ({ ...prev, [filterType]: value }))
		const newFilterData = {
			...data.filterData,
			[filterType]: value,
			page: 1,
		}
		reloadData(newFilterData)
	}

	const handleShowMoreTableData = () => {
		const filterData = data.filterData
		reloadData({ ...filterData, page: filterData.page + 1 })
	}

	const handleClose = () => {
		setOpenManualForm(false)
		reloadData({ ...data.filterData, page: 1 })
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		load(`${location.pathname}?${searchParams}`)
	}, [load, searchParams])

	return (
		<MainContent
			headerChildren={
				<TribeHeader
					name={data.tribe.name}
					membersCount={data.total}
					managerName={data.tribe.manager.name}
					view={view}
					setView={setView}
				>
					{(view === 'culte' || view === 'service') && (
						<div className="hidden sm:block">
							<SelectInput
								items={statusFilterData}
								placeholder="Statut"
								onChange={value => handleFilterChange('status', value)}
							/>
						</div>
					)}
					{(view === 'culte' || view === 'service') && (
						<div className="hidden sm:block">
							<SelectInput
								items={stateFilterData}
								onChange={value => handleFilterChange('state', value)}
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
						<Button
							variant="outline"
							size="sm"
							className="space-x-1 border-input"
						>
							<span>Exporter</span>
							<RiFileExcel2Line />
						</Button>
					</div>
					{(view === 'culte' || view === 'service') && (
						<Button
							className="hidden sm:block"
							variant={'gold'}
							onClick={() => setOpenManualForm(true)}
						>
							Créer un fidèle
						</Button>
					)}
				</TribeHeader>
			}
		>
			{(view === 'culte' || view === 'service') && (
				<Card className="space-y-2 pb-4 mb-2">
					<TribeMemberTable
						data={data.members as unknown as MemberMonthlyAttendances[]}
						tribeId={data.tribe.id}
					/>
					<div className="flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
							disabled={data.members.length === data.total}
							onClick={handleShowMoreTableData}
						>
							Voir plus
						</Button>
					</div>
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
						<>
							<StatTable
								data={data.members as unknown as MemberMonthlyAttendances[]}
								tribeId={data.tribe.id}
							/>
							<div className="flex justify-center">
								<Button
									size="sm"
									type="button"
									variant="ghost"
									className="bg-neutral-200 rounded-full"
									disabled={data.members.length === data.total}
									onClick={handleShowMoreTableData}
								>
									Voir plus
								</Button>
							</div>
						</>
					)}
				</div>
			)}

			{openManualForm && (
				<MemberFormDialog onClose={handleClose} tribeId={data.tribe.id} />
			)}

			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
