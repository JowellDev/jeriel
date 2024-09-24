import { useCallback, useEffect, useState } from 'react'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { InputSearch } from '~/components/form/input-search'
import {
	type MetaFunction,
	useFetcher,
	useLoaderData,
	useSearchParams,
} from '@remix-run/react'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import {
	RiAddLine,
	RiArrowDownSLine,
	RiFileExcel2Line,
	RiFilterLine,
} from '@remixicon/react'
import { Card } from '~/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import type { MemberMonthlyAttendances } from '~/models/member.model'
import { loaderFn } from './loader.server'
import { actionFn } from './action.server'
import { type MemberFilterOptions } from './types'
import { buildSearchParams } from '~/utils/url'
import { useDebounceCallback } from 'usehooks-ts'
import type { DateRange } from 'react-day-picker'
import MemberTable from './components/member-table'
import MemberFormDialog from './components/member-form-dialog'
import MemberUploadFormDialog from './components/member-upload-form-dialog'
import FilterFormDialog from './components/filter-form'
import { startOfMonth } from 'date-fns'
import { DEFAULT_QUERY_TAKE } from '~/shared/constants'
import { MonthPicker } from '~/components/form/month-picker'

const speedDialItemsActions = {
	ADD_MEMBER: 'add-member',
	UPLOAD_FILE: 'upload-file',
	FILTER_MEMBERS: 'filter-members',
}

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Ajouter un fidèle',
		action: speedDialItemsActions.ADD_MEMBER,
	},
	{
		Icon: RiFilterLine,
		label: 'Filter la liste',
		action: speedDialItemsActions.FILTER_MEMBERS,
	},
]

export const meta: MetaFunction = () => [{ title: 'Gestion des fidèles' }]

export const loader = loaderFn

export const action = actionFn

export default function Member() {
	const loaderData = useLoaderData<typeof loaderFn>()
	const [data, setData] = useState(loaderData)
	const { load, ...fetcher } = useFetcher<typeof loaderFn>()

	const [openManualForm, setOpenManualForm] = useState(false)
	const [openUploadForm, setOpenUploadForm] = useState(false)
	const [openFilterForm, setOpenFilterForm] = useState(false)
	const [currentMounth, setCurrentMonth] = useState<Date>(new Date())
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(data: MemberFilterOptions) => {
			const params = buildSearchParams(data)
			load(`${location.pathname}?${params}`)
		},
		[load],
	)

	const handleClose = () => {
		setOpenManualForm(false)
		setOpenUploadForm(false)
		setOpenFilterForm(false)
		reloadData({ ...data.filterData, page: 1 })
	}

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			...data.filterData,
			query: searchQuery,
			page: 1,
		})
		debounced(params)
	}

	function handleOnFilter(options: MemberFilterOptions) {
		reloadData({
			...data.filterData,
			...options,
			page: 1,
		})
	}

	function handleOnPeriodChange(range: DateRange) {
		if (range.from && range.to) {
			const filterData = {
				...data.filterData,
				from: range?.from?.toISOString(),
				to: range?.to?.toISOString(),
				page: 1,
			}

			setCurrentMonth(startOfMonth(range.to))
			reloadData(filterData)
		}
	}

	const handleSpeedDialItemClick = (action: string) => {
		if (action === speedDialItemsActions.ADD_MEMBER) setOpenManualForm(true)
		if (action === speedDialItemsActions.UPLOAD_FILE) setOpenUploadForm(true)
		if (action === speedDialItemsActions.FILTER_MEMBERS) setOpenFilterForm(true)
	}

	function handleDisplayMore() {
		const filterData = data.filterData
		reloadData({ ...filterData, page: filterData.page + 1 })
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
				<Header title="Fidèles">
					<div className="hidden sm:flex sm:space-x-2 sm:items-center">
						<MonthPicker className="w-30" onChange={handleOnPeriodChange} />
						<fetcher.Form className="flex items-center gap-3">
							<InputSearch
								onSearch={handleSearch}
								placeholder="Nom / téléphone"
								defaultValue={data.filterData.query}
							/>
						</fetcher.Form>
						<Button
							variant="outline"
							className="flex items-center space-x-1 border-input"
							onClick={() => setOpenFilterForm(true)}
						>
							<span>Filtrer</span>
							<RiFilterLine />
						</Button>
						<Button
							variant="outline"
							className="flex items-center space-x-1 border-input"
						>
							<span>Exporter</span>
							<RiFileExcel2Line />
						</Button>
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
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => setOpenUploadForm(true)}
							>
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
					<MemberTable
						currentMonth={currentMounth}
						data={data.members as unknown as MemberMonthlyAttendances[]}
					/>
					{data.members.length >= DEFAULT_QUERY_TAKE && (
						<div className="flex justify-center">
							<Button
								size="sm"
								type="button"
								variant="ghost"
								disabled={data.members.length === data.total}
								className="bg-neutral-200 rounded-full"
								onClick={handleDisplayMore}
							>
								Voir plus
							</Button>
						</div>
					)}
				</Card>
			</div>
			{openManualForm && <MemberFormDialog onClose={handleClose} />}
			{openUploadForm && <MemberUploadFormDialog onClose={handleClose} />}
			{openFilterForm && (
				<FilterFormDialog onSubmit={handleOnFilter} onClose={handleClose} />
			)}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
