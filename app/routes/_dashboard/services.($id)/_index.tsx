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
import { FORM_INTENT, speedDialItemsActions } from './constants'
import { TableToolbar } from '~/components/toolbar'
import { Card } from '~/components/ui/card'
import ServiceTable from './components/tables/service-table'
import { ServiceFormDialog } from './components/service-form-dalog'
import { actionFn } from './action.server'
import { ConfirmDialog } from '../../../shared/forms/confirm-form-dialog'
import ManagerServiceTable from './components/manager/table'
import { GeneralErrorBoundary } from '~/components/error-boundary'

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
				<ServiceFormDialog onClose={handleOnClose} service={selectedService} />
			)}

			{openConfirmForm && selectedService && (
				<ConfirmDialog
					data={selectedService}
					onClose={handleOnClose}
					title="Confirmation de suppression"
					message="Voulez-vous vraiment supprimer ce service ? Cette action est irréversible."
					intent={FORM_INTENT.DELETE}
					successMessage="Service supprimé avec succès."
				/>
			)}
		</MainContent>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
