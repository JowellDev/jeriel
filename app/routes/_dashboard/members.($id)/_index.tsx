import { useCallback, useEffect, useState } from 'react'
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
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine, RiArrowDownSLine } from '@remixicon/react'
import { MemberTable } from './components/member-table'
import { Card } from '~/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { MemberFormDialog } from './components/member-form-dialog'
import type { MemberWithMonthlyAttendances } from '~/models/member.model'
import { loaderFn } from './loader.server'
import { actionFn } from './action.server'
import { type MemberFilterOptions } from './types'
import { buildSearchParams } from '~/utils/url'
import { useDebounceCallback } from 'usehooks-ts'

const speedDialItemsActions = {
	ADD_MEMBER: 'add-member',
	UPLOAD_FILE: 'upload-file',
}

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Ajouter un fidèle',
		action: speedDialItemsActions.ADD_MEMBER,
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

	const handleSpeedDialItemClick = (action: string) => {
		if (action === speedDialItemsActions.ADD_MEMBER) setOpenManualForm(true)
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
					<div className="hidden sm:block">
						<fetcher.Form className="flex items-center gap-3">
							<InputSearch
								onSearch={handleSearch}
								placeholder="Recherche par nom"
								defaultValue={data.filterData.query}
							/>
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
					<MemberTable
						data={data.members as unknown as MemberWithMonthlyAttendances[]}
					/>
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
				</Card>
			</div>
			{openManualForm && <MemberFormDialog onClose={handleClose} />}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
