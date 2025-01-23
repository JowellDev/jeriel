import { useCallback, useEffect, useState } from 'react'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { DepartmentsFormDialog } from './components/departments-form-dialog'
import { DepartmentTable } from './components/departments-table'
import { actionFn } from './action.server'
import type { Department } from './model'
import { loaderFn, type LoaderType } from './loader.server'
import {
	useFetcher,
	useLoaderData,
	useLocation,
	useSearchParams,
} from '@remix-run/react'
import { useDebounceCallback } from 'usehooks-ts'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine } from '@remixicon/react'
import { Card } from '~/components/ui/card'
import { type FilterOption } from './schema'
import { buildSearchParams } from '~/utils/url'
import { TableToolbar } from '~/components/toolbar'

export const loader = loaderFn
export const action = actionFn

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Ajouter un département',
		action: 'add-department',
	},
]

export default function Church() {
	const [openForm, setOpenForm] = useState(false)
	const [selectedDepartment, setSelectedDepartment] = useState<
		Department | undefined
	>(undefined)

	const loaderData = useLoaderData<typeof loader>()
	const [data, setData] = useState(loaderData)

	const { load, ...fetcher } = useFetcher<LoaderType>()
	const location = useLocation()

	const [searchParams, setSearchParams] = useSearchParams()

	const debounced = useDebounceCallback(setSearchParams, 500)

	const reloadData = useCallback(
		(option: FilterOption) => {
			const params = buildSearchParams(option)
			load(`${location.pathname}?${params}`)
		},
		[load, location.pathname],
	)

	const handleEdit = (value: Department) => {
		setSelectedDepartment(value)
		setOpenForm(true)
	}

	const handleClose = () => {
		setOpenForm(false)
		setSelectedDepartment(undefined)
		reloadData({ ...data.filterOption, page: 1 })
	}

	const handleSearch = (searchQuery: string) => {
		const params = buildSearchParams({
			...data.filterOption,
			query: searchQuery,
			page: 1,
		})
		debounced(params)
	}

	const handleSpeedDialItemClick = (action: string) => {
		if (action === 'add-department') setOpenForm(true)
	}

	function handleDisplayMore() {
		const option = data.filterOption
		reloadData({ ...option, page: option.page + 1 })
	}

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher?.data) {
			setData(fetcher.data)
		}
	}, [fetcher.state, fetcher.data])

	useEffect(() => {
		if (searchParams.toString()) {
			load(`${location.pathname}?${searchParams.toString()}`)
		}
	}, [searchParams, location.pathname, load])

	return (
		<MainContent
			headerChildren={
				<Header title="Départements">
					<Button
						className="hidden sm:block"
						variant={'primary'}
						onClick={() => setOpenForm(true)}
					>
						Ajouter
					</Button>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<TableToolbar
					onSearch={handleSearch}
					searchContainerClassName="sm:w-1/3"
					align="end"
					onExport={() => 2}
				/>
				<Card className="space-y-2 pb-4 mb-2">
					<DepartmentTable data={data.departments} onEdit={handleEdit} />
					<div className="flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
							disabled={data.departments.length === data.total}
							onClick={handleDisplayMore}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>
			{openForm && (
				<DepartmentsFormDialog
					onClose={handleClose}
					department={selectedDepartment}
				/>
			)}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
