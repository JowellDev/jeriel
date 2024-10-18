import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { type MetaFunction, useLoaderData } from '@remix-run/react'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine, RiFileExcel2Line, RiFilterLine } from '@remixicon/react'
import { useServices } from './hooks/use-services'
import { loaderFn } from './loader.server'
import { speedDialItemsActions } from './constants'
import { InputSearch } from '~/components/form/input-search'
import { TableToolbar } from '~/components/toolbar'

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Ajouter un service',
		action: speedDialItemsActions.ADD_SERVICE,
	},
]

export const meta: MetaFunction = () => [{ title: 'Gestion des services' }]

export const loader = loaderFn

export default function Member() {
	const loaderData = useLoaderData<typeof loaderFn>()

	const {
		data,
		fetcher,
		openEditForm,
		openFilterForm,
		handleSearch,
		handleSpeedDialItemClick,
		handleDisplayMore,
		handleOnFilter,
		handleOnExport,
		handleClose,
		setOpenEditForm,
		setOpenFilterForm,
	} = useServices(loaderData)

	return (
		<MainContent
			headerChildren={
				<Header title="Services">
					<div className="hidden sm:flex sm:space-x-2 sm:items-center">
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
							<RiFilterLine size={20} />
						</Button>
						<Button
							variant="outline"
							className="flex items-center space-x-1 border-input"
						>
							<span>Exporter</span>
							<RiFileExcel2Line size={20} />
						</Button>
					</div>
					<Button
						className="hidden sm:flex items-center"
						variant="gold"
						onClick={() => setOpenEditForm(true)}
					>
						Ajouter un service
					</Button>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<div className="sm:hidden">
					<TableToolbar
						onSearch={handleSearch}
						onFilter={() => setOpenFilterForm(true)}
						onExport={handleOnExport}
					/>
				</div>
			</div>
			{openEditForm && <div>Service form</div>}
			{openFilterForm && <div>Filter form</div>}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
