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
import { TableToolbar } from '~/components/toolbar'
import { Card } from '~/components/ui/card'
import ServiceTable from './components/tables/service-table'
import { ServiceFormDialog } from './components/service-form-dalog'
import { actionFn } from './action.server'
import { type ServiceData } from './types'
import { ConfirmFormDialog } from './components/confirm-form-dialog'

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Ajouter',
		action: speedDialItemsActions.ADD_SERVICE,
	},
]
export const meta: MetaFunction = () => [{ title: 'Gestion des services' }]

export const loader = loaderFn

export const action = actionFn

export default function Member() {
	const loaderData = useLoaderData<typeof loaderFn>()

	const {
		data,
		openEditForm,
		openConfirmForm,
		selectedService,
		handleSearch,
		handleOnEdit,
		handleOnClose,
		handleOnExport,
		handleOnDelete,
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
						Ajouter
					</Button>
				</Header>
			}
		>
			<div className="space-y-2 mb-4">
				<TableToolbar
					align="end"
					searchContainerClassName="sm:w-1/4"
					onSearch={handleSearch}
					onExport={handleOnExport}
					searchInputPlaceholder="Rechercher par tribu / département"
				/>
			</div>

			<Card className="space-y-2 pb-4 mb-2">
				<ServiceTable
					data={data.services as unknown as ServiceData[]}
					onEdit={handleOnEdit}
					onDelete={handleOnDelete}
				/>
				<div className="flex justify-center">
					<Button
						size="sm"
						type="button"
						variant="ghost"
						disabled={data.services.length === data.total}
						className="bg-neutral-200 rounded-full"
					>
						Voir plus
					</Button>
				</div>
			</Card>

			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>

			{openEditForm && (
				<ServiceFormDialog onClose={handleOnClose} service={selectedService} />
			)}

			{openConfirmForm && selectedService && (
				<ConfirmFormDialog onClose={handleOnClose} service={selectedService} />
			)}
		</MainContent>
	)
}
