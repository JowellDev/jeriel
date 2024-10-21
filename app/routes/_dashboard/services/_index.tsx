import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { type MetaFunction, useLoaderData } from '@remix-run/react'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine } from '@remixicon/react'
import { useServices } from './hooks/use-services'
import { loaderFn } from './loader.server'
import { speedDialItemsActions } from './constants'
import { TableToolbar, type View } from '~/components/toolbar'

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Ajouter un service',
		action: speedDialItemsActions.ADD_SERVICE,
	},
]

const toolbarViews = [
	{ id: 'TRIBE', label: 'Tribus' },
	{ id: 'DEPARTMENT', label: 'Départements' },
] as View[]

export const meta: MetaFunction = () => [{ title: 'Gestion des services' }]

export const loader = loaderFn

export default function Member() {
	const loaderData = useLoaderData<typeof loaderFn>()

	const {
		openEditForm,
		selectedView,
		handleSearch,
		setSeletedView,
		handleOnExport,
		setOpenEditForm,
		handleSpeedDialItemClick,
	} = useServices(loaderData)

	return (
		<MainContent
			headerChildren={
				<Header title="Services">
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
			<div className="space-y-2 mb-4">
				<TableToolbar
					align="end"
					searchContainerClassName="sm:w-1/2"
					onSearch={handleSearch}
					onExport={handleOnExport}
					searchInputPlaceholder={`Nom ${selectedView === 'TRIBE' ? 'de la tribu' : 'du département'}`}
					views={toolbarViews}
					view={selectedView}
					setView={setSeletedView}
				/>
			</div>

			{openEditForm && <div>Service form</div>}
			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
