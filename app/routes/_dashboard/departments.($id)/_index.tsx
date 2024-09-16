import { useEffect, useState } from 'react'
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
import { InputSearch } from '~/components/form/input-search'

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
	const { departments, query } = useLoaderData<typeof loader>()
	const { load, ...fetcher } = useFetcher<LoaderType>()
	const location = useLocation()
	const [searchParams, setSearchParams] = useSearchParams()
	const debounced = useDebounceCallback(setSearchParams, 500)

	const handleEdit = (value: Department) => {
		setSelectedDepartment(value)
		setOpenForm(true)
	}

	const handleClose = () => {
		setOpenForm(false)
		setSelectedDepartment(undefined)
		load(`${location.pathname}?${searchParams}`)
	}

	const handleSearch = (searchQuery: string) => {
		debounced({ query: searchQuery })
	}

	const handleSpeedDialItemClick = (action: string) => {
		if (action === 'add-department') setOpenForm(true)
	}

	useEffect(() => {
		if (searchParams.toString()) {
			load(`${location.pathname}?${searchParams.toString()}`)
		}
	}, [searchParams, location.pathname, load])

	return (
		<MainContent
			headerChildren={
				<Header title="Départements">
					<div className="hidden sm:block">
						<fetcher.Form>
							<InputSearch
								defaultValue={query}
								onSearch={handleSearch}
								placeholder="Recherche..."
							/>
						</fetcher.Form>
					</div>
					<Button
						className="hidden sm:block"
						variant={'gold'}
						onClick={() => setOpenForm(true)}
					>
						Ajouter
					</Button>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<fetcher.Form className="sm:hidden">
					<InputSearch
						defaultValue={query}
						onSearch={handleSearch}
						placeholder="Recherche..."
					/>
				</fetcher.Form>
				<DepartmentTable
					data={fetcher.data?.departments || departments}
					onEdit={handleEdit}
				/>
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
