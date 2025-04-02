import { RiGitPullRequestLine } from '@remixicon/react'
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

export const loader = loaderFn
export const action = actionFn

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
		setIsFormOpen,
		handleClose,
		handleDisplayMore,
		handleSearch,
		handleSpeedDialItemClick,
	} = useArchivesRequest()

	return (
		<MainContent
			headerChildren={
				<Header title="Demande d'archives">
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
					<ArchiveRequestTable data={data.archiveRequests} />

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
				/>
			)}

			<SpeedDialMenu
				items={SPEED_DIAL_ITEMS}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}
