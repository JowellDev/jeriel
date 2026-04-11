import { RiGitPullRequestLine } from '@remixicon/react'
import { type MetaFunction } from '@remix-run/node'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { TableToolbar } from '~/components/toolbar'
import { ArchiveFormDialog } from './components/archive-form-dialog'
import { ArchiveRequestTable } from './components/archive-request-table'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { loaderFn } from './loader.server'
import { actionFn } from './action.server'
import { useArchivesRequest } from './hooks/use-archives-request'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'

export const loader = loaderFn
export const action = actionFn

export const meta: MetaFunction = () => [
	{ title: "Jeriel | Demande d'archivages" },
]

const SPEED_DIAL_ITEMS: SpeedDialAction[] = [
	{
		Icon: RiGitPullRequestLine,
		label: 'Faire une demande',
		action: 'request-an-archive',
	},
]

export default function ArchiveRequest() {
	const {
		data,
		isFormOpen,
		editRequest,
		requestToDelete,
		setIsFormOpen,
		handleClose,
		handleDisplayMore,
		handleSearch,
		handleSpeedDialItemClick,
		handleEdit,
		handleDeleteRequest,
		handleConfirmDelete,
		handleCancelDelete,
	} = useArchivesRequest()

	return (
		<MainContent
			headerChildren={
				<Header title="Demande d'archivage">
					<Button
						className="hidden sm:block"
						variant="primary"
						onClick={() => setIsFormOpen(true)}
					>
						Faire une demande
					</Button>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<TableToolbar
					onSearch={handleSearch}
					searchContainerClassName="sm:w-1/3"
					align="end"
				/>

				<Card className="space-y-2 pb-4 mb-2">
					<ArchiveRequestTable
						data={data.archiveRequests}
						onEdit={handleEdit}
						onDelete={handleDeleteRequest}
					/>

					<div className="flex justify-center">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							className="bg-neutral-200 rounded-full"
							disabled={data.archiveRequests.length === data.total}
							onClick={handleDisplayMore}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>

			{isFormOpen && (
				<ArchiveFormDialog
					onClose={handleClose}
					authorizedEntities={data.authorizedEntities}
					editRequest={editRequest}
				/>
			)}

			{requestToDelete && (
				<Dialog open onOpenChange={handleCancelDelete}>
					<DialogContent
						className="md:max-w-md"
						onOpenAutoFocus={e => e.preventDefault()}
						onPointerDownOutside={e => e.preventDefault()}
					>
						<DialogHeader>
							<DialogTitle className="text-red-500">
								Supprimer la demande
							</DialogTitle>
						</DialogHeader>
						<div className="mt-2 text-sm text-gray-700">
							Voulez-vous vraiment supprimer cette demande d&apos;archivage ?
							Cette action est irréversible.
						</div>
						<div className="flex justify-end gap-3 mt-4">
							<Button
								type="button"
								variant="outline"
								onClick={handleCancelDelete}
							>
								Annuler
							</Button>
							<Button
								type="button"
								variant="destructive"
								onClick={handleConfirmDelete}
							>
								Supprimer
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			)}

			<SpeedDialMenu
				items={SPEED_DIAL_ITEMS}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
