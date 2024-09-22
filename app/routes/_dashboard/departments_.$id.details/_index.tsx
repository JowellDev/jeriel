import { MainContent } from '~/components/layout/main-content'
import { TableHeader } from './components/table-header'
import { Button } from '~/components/ui/button'
import { type LoaderData, loaderFn } from './loader.server'
import {
	type MetaFunction,
	useLoaderData,
	useFetcher,
	useSearchParams,
} from '@remix-run/react'
import { Card } from '~/components/ui/card'
import { MemberTable } from './components/member-table'
import { type MemberFilterOptions, Views } from './models'
import { useDebounceCallback } from 'usehooks-ts'
import { RiAddLine, RiArrowDownSLine, RiFileExcel2Line } from '@remixicon/react'
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
import { AssistantFormDialog } from './components/assistant-form'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import UploadFormDialog from './components/upload-form'
import { type Option } from '~/components/form/multi-selector'

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

export const meta: MetaFunction = () => [{ title: 'Gestion des départements' }]

export const loader = loaderFn

export const action = actionFn

export default function DepartmentDetails() {
	const loaderData = useLoaderData<LoaderData>()

	const [data, setData] = useState(loaderData)

	const { load, ...fetcher } = useFetcher<typeof loader>()

	const [view, setView] = useState<(typeof Views)[Keys]>(Views.CULTE)
	const [statView, setStatView] = useState<(typeof Views)[Keys]>(Views.CULTE)

	const [filters, setFilters] = useState({
		state: 'ALL',
		status: 'ALL',
	})

	const [membersOption, setMembersOption] = useState<Option[]>([])

	const [openManualForm, setOpenManualForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openAssistantForm, setOpenAssistantForm] = useState(false)

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
		setOpenUploadForm(false)
		setOpenAssistantForm(false)
		reloadData({ ...data.filterData, page: 1 })
	}

	const getOptions = useCallback(
		(data: { id: string; name: string }[] | undefined) => {
			return (
				data?.map(member => ({ label: member.name, value: member.id })) || []
			)
		},
		[],
	)

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		load(`${location.pathname}?${searchParams}`)
	}, [load, searchParams])

	useEffect(() => {
		const members = getOptions(data.members)
		const assistants = getOptions(data.assistants)
		const allOptions = [...members, ...assistants]

		const uniqueOptions = allOptions.filter(
			(option, index, self) =>
				index ===
				self.findIndex(
					t => t.value === option.value && t.label === option.label,
				),
		)

		setMembersOption(uniqueOptions)
	}, [data])

	return (
		<MainContent
			headerChildren={
				<TableHeader
					name={data.tribe.name}
					membersCount={data.total}
					managerName={data.tribe.manager.name}
					assistants={data.assistants}
					view={view}
					setView={setView}
					onOpenAssistantForm={() => setOpenAssistantForm(true)}
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
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									className="hidden sm:flex items-center"
									variant={'gold'}
								>
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
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={() => setOpenUploadForm(true)}
								>
									Importer un fichier
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</TableHeader>
			}
		>
			{(view === 'culte' || view === 'service') && (
				<Card className="space-y-2 pb-4 mb-2">
					<MemberTable
						data={data.members as unknown as MemberMonthlyAttendances[]}
						departmentId={data.tribe.id}
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

			{openUploadForm && <UploadFormDialog onClose={handleClose} />}

			{openAssistantForm && (
				<AssistantFormDialog
					onClose={handleClose}
					departmentId={data.tribe.id}
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
