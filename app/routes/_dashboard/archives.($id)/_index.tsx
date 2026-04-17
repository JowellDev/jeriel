import { type MetaFunction } from '@remix-run/react'
import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { TableToolbar } from '~/components/toolbar'
import { ArchiveFormDialog } from './components/archive-form-dialog'
import { ArchiveRequestTable } from './components/archive-request-table'
import { ArchivedUsersTable } from './components/archived-users-table'
import { loaderFn } from './loader.server'
import { actionFn } from './action.server'
import { ConfirmDialog } from '../../../shared/forms/confirm-form-dialog'
import { useArchives } from './hooks/use-archives'
import { GeneralErrorBoundary } from '~/components/error-boundary'

export const loader = loaderFn
export const action = actionFn

const VIEWS = [
	{ id: 'ARCHIVE_REQUEST' as const, label: 'Demandes' },
	{ id: 'ARCHIVE' as const, label: 'Archives' },
]

export const meta: MetaFunction = () => [
	{ title: 'Jeriel | Gestion des archives' },
]

export default function Archives() {
	const {
		data,
		view,
		setView,
		formState,
		selectedUser,
		openConfirmForm,
		handleClose,
		handleEdit,
		handleLoadMore,
		handleOnClose,
		handleOnUnarchive,
		handleSearch,
	} = useArchives()

	const hasMoreRequestsData = data.archiveRequests?.length < data.total
	const hasMoreArchives = data.archivedUsers?.length < data.totalArchivedUsers

	return (
		<MainContent headerChildren={<Header title="Archives" />}>
			<div className="flex flex-col gap-5">
				<TableToolbar
					onSearch={handleSearch}
					searchContainerClassName="sm:w-1/3"
					align="end"
					view={view}
					setView={setView}
					views={VIEWS}
				/>

				<Card className="space-y-2 pb-4 mb-2">
					{view === 'ARCHIVE_REQUEST' ? (
						<>
							<ArchiveRequestTable
								data={data.archiveRequests}
								onEdit={handleEdit}
							/>

							{hasMoreRequestsData && (
								<div className="flex justify-center">
									<Button
										size="sm"
										variant="ghost"
										className="bg-neutral-200 rounded-full"
										onClick={handleLoadMore}
									>
										Voir plus
									</Button>
								</div>
							)}
						</>
					) : (
						<>
							<ArchivedUsersTable
								data={data.archivedUsers}
								onUnarchive={handleOnUnarchive}
							/>
							{hasMoreArchives && (
								<div className="flex justify-center">
									<Button
										size="sm"
										variant="ghost"
										className="bg-neutral-200 rounded-full"
										onClick={handleLoadMore}
									>
										Voir plus
									</Button>
								</div>
							)}
						</>
					)}
				</Card>
			</div>

			{formState.isOpen && formState.request && (
				<ArchiveFormDialog
					onClose={handleClose}
					archiveRequest={formState.request}
				/>
			)}

			{openConfirmForm && selectedUser && (
				<ConfirmDialog
					data={selectedUser}
					onClose={handleOnClose}
					title="Confirmation de désarchivage"
					message="Voulez-vous vraiment désarchiver cet utilisateur ? Cette action est irréversible."
					intent="unarchivate"
					variant="destructive"
					successMessage="Utilisateur désarchivé avec succès."
				/>
			)}
		</MainContent>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
