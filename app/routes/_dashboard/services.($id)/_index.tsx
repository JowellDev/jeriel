import { type MetaFunction, useLoaderData } from '@remix-run/react'
import { RiAddLine } from '@remixicon/react'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { TableToolbar } from '~/components/toolbar'
import { Card } from '~/components/ui/card'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { useServices } from './hooks/use-services'
import { speedDialItemsActions } from './constants'
import { EditServiceDialog } from './components/dialogs/edit-service-dalog'
import ServiceTable from './components/tables/admin-service/admin-service-table'
import ManagerServiceTable from './components/tables/manager-service/manager-service-table'
import { DeleteServiceForm } from './components/forms/delete-service-form'

import { loaderFn } from './server/loader.server'
import { actionFn } from './server/action.server'

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiAddLine,
		label: 'Ajouter',
		action: speedDialItemsActions.ADD_SERVICE,
	},
]
export const meta: MetaFunction = () => [
	{ title: 'Jeriel | Gestion des services' },
]

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
		handleOnDelete,
		handleDisplayMore,
		setOpenEditForm,
		handleSpeedDialItemClick,
	} = useServices(loaderData)

	return (
		<MainContent
			headerChildren={
				<Header title="Services">
					{data.isAdmin && (
						<Button
							className="hidden sm:flex items-center"
							variant="primary"
							onClick={() => setOpenEditForm(true)}
						>
							Ajouter
						</Button>
					)}
				</Header>
			}
		>
			<div className="space-y-2 mb-5">
				<TableToolbar
					align="end"
					searchContainerClassName="sm:w-1/4"
					onSearch={handleSearch}
					searchInputPlaceholder="Rechercher par tribu / département"
				/>
			</div>

			<Card className="space-y-2 pb-4 mb-2">
				{data.isAdmin ? (
					<ServiceTable
						data={data.services}
						onEdit={handleOnEdit}
						onDelete={handleOnDelete}
					/>
				) : (
					<ManagerServiceTable data={data.services} />
				)}
				<div className="flex justify-center">
					<Button
						size="sm"
						type="button"
						variant="ghost"
						disabled={data.services.length === data.total}
						className="bg-neutral-200 rounded-full"
						onClick={handleDisplayMore}
					>
						Voir plus
					</Button>
				</div>
			</Card>

			{data.isAdmin && (
				<SpeedDialMenu
					items={speedDialItems}
					onClick={handleSpeedDialItemClick}
				/>
			)}

			{openEditForm && (
				<EditServiceDialog onClose={handleOnClose} service={selectedService} />
			)}

			{openConfirmForm && selectedService && (
				<DeleteServiceForm service={selectedService} onClose={handleOnClose} />
			)}
		</MainContent>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
