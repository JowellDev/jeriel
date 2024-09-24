import {
	type MetaFunction,
	useFetcher,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react'
import { useCallback, useEffect, useState } from 'react'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { InputSearch } from '~/components/form/input-search'
import { useDebounceCallback } from 'usehooks-ts'
import { Card } from '~/components/ui/card'
import { type LoaderData, loaderFn } from './loader.server'
import type {
	Keys,
	Member,
	MemberFilterOptions,
	MemberWithMonthlyAttendances,
	SelectInputData,
} from './types'
import { Views } from './types'
import SpeedDialMenu from '~/components/layout/mobile/speed-dial-menu'
import { RiFileExcel2Line } from '@remixicon/react'
import { SelectInput } from '~/components/form/select-input'
import { HonorFamilyHeader } from './components/header'
import { stateFilterData, statusFilterData, speedDialItems } from './constants'
import { HonorFamilyMembersTable } from './components/table'
import { AssistantFormDialog } from './components/assistant-form'
import { buildSearchParams } from '~/utils/url'
import { actionFn } from './action.server'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'

export const meta: MetaFunction = () => [
	{ title: 'Membres de la famille d’honneur' },
]

export const loader = loaderFn
export const action = actionFn

export default function HonorFamily() {
	const loaderData = useLoaderData<LoaderData>()
	const [{ honorFamily, filterData }, setData] = useState(loaderData)
	const { load, ...fetcher } = useFetcher<LoaderData>()
	// const [searchData, setSearchData] = useState('')
	const [view, setView] = useState<(typeof Views)[Keys]>(Views.CULTE)
	// const [openManualForm, setOpenManualForm] = useState(false)
	// const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openAssistantForm, setOpenAssistantForm] = useState(false)
	const [membersOption, setMembersOption] = useState<SelectInputData[]>([])
	const [filters, setFilters] = useState({ state: 'ALL', status: 'ALL' })

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
		// if (action === speedDialItemsActions.ADD_MEMBER)
		// 	return setOpenManualForm(true)
	}

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			...filterData,
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
			...filterData,
			[filterType]: value,
			page: 1,
		}
		reloadData(newFilterData)
	}

	const handleShowMoreTableData = () => {
		reloadData({ ...filterData, take: filterData.take + 5 })
	}

	const handleClose = () => {
		// setOpenManualForm(false)
		// setOpenUploadForm(false)
		setOpenAssistantForm(false)
		reloadData({ ...filterData, page: 1 })
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		load(`${location.pathname}?${searchParams}`)
	}, [load, searchParams])

	useEffect(() => {
		setMembersOption(honorFamily.membersWithoutAssistants)
	}, [honorFamily.membersWithoutAssistants])

	return (
		<MainContent
			headerChildren={
				<HonorFamilyHeader
					view={view}
					setView={setView}
					name={honorFamily.name}
					returnLink="/honor-families"
					managerName={honorFamily.manager.name}
					membersCount={honorFamily._count.members}
					assistants={honorFamily.assistants as unknown as Member[]}
					onOpenAssistantForm={() => setOpenAssistantForm(true)}
				>
					{(view === 'culte' || view === 'service') && (
						<div className="hidden sm:block">
							<SelectInput
								placeholder="Statut"
								items={statusFilterData}
								onChange={value => handleFilterChange('status', value)}
							/>
						</div>
					)}
					{(view === 'culte' || view === 'service') && (
						<div className="hidden sm:block">
							<SelectInput
								placeholder="Etat"
								items={stateFilterData}
								onChange={value => handleFilterChange('state', value)}
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
							className="flex items-center space-x-1 border-input"
						>
							<span>Exporter</span>
							<RiFileExcel2Line />
						</Button>
					</div>
					{(view === 'culte' || view === 'service') && (
						<Button className="hidden sm:block" variant={'gold'}>
							Ajouter un fidèle
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
								disabled={filterData.take >= honorFamily._count.members}
							>
								Voir plus
							</Button>
						</div>
					)}
				</Card>
			)}

			{/* <></> */}

			{openAssistantForm && (
				<AssistantFormDialog
					onClose={handleClose}
					honorFamilyId={honorFamily.id}
					membersOption={membersOption}
				/>
			)}

			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
