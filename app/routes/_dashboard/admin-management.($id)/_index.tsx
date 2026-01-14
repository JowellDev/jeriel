import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { Button } from '~/components/ui/button'
import { InputSearch } from '~/components/form/input-search'
import { type MetaFunction, useLoaderData } from '@remix-run/react'
import SpeedDialMenu, {
	type SpeedDialAction,
} from '~/components/layout/mobile/speed-dial-menu'
import { RiAddLine, RiUserAddLine } from '@remixicon/react'
import { Card } from '~/components/ui/card'
import AdminTable from './components/tables/admin-table'
import { AddAdminForm } from './components/forms/add-admin-form'
import { ResetPasswordForm } from './components/forms/reset-password-form'
import { TableToolbar } from '~/components/toolbar'
import { speedDialItemsActions } from './constants'
import { useAdmins } from './hooks/use-admins'
import { GeneralErrorBoundary } from '~/components/error-boundary'

import { loaderFn } from './server/loader.server'
import { actionFn } from './server/action.server'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { ButtonLoading } from '~/components/button-loading'

const speedDialItems: SpeedDialAction[] = [
	{
		Icon: RiUserAddLine,
		label: 'Ajouter un administrateur',
		action: speedDialItemsActions.ADD_ADMIN,
	},
]

export const meta: MetaFunction = () => [
	{ title: 'Jeriel | Gestion des administrateurs' },
]

export const loader = loaderFn
export const action = actionFn

export default function AdminManagement() {
	const loaderData = useLoaderData<typeof loaderFn>()

	const {
		data,
		openAddForm,
		isExporting,
		adminToRemove,
		adminToResetPassword,
		isRemovingAdmin,
		isResettingPassword,
		handleClose,
		handleSearch,
		handleExport,
		handleDisplayMore,
		setOpenAddForm,
		handleSpeedDialItemClick,
		handleRemoveAdmin,
		confirmRemoveAdmin,
		cancelRemoveAdmin,
		handleResetPassword,
		confirmResetPassword,
		cancelResetPassword,
	} = useAdmins(loaderData as any)

	return (
		<MainContent
			headerChildren={
				<Header title="Gestion des administrateurs">
					<div className="hidden sm:flex sm:space-x-2 sm:items-center">
						<div className="flex items-center gap-3">
							<InputSearch
								onSearch={handleSearch}
								placeholder="Nom, email..."
								defaultValue={data.filterData.query}
							/>
						</div>
						{/* <Button
							variant="outline"
							className="flex items-center space-x-1 border-input"
							onClick={() => handleExport()}
							disabled={isExporting || loaderData.total <= 0}
						>
							<span>Exporter</span>
							<RiFileExcel2Line size={20} />
						</Button> */}
					</div>
					<Button
						className="hidden sm:flex items-center gap-2"
						variant={'primary'}
						onClick={() => setOpenAddForm(true)}
					>
						<RiAddLine size={20} />
						<span>Ajouter un administrateur</span>
					</Button>
				</Header>
			}
		>
			<div className="flex flex-col gap-5">
				<div className="sm:hidden">
					<TableToolbar
						onSearch={handleSearch}
						onExport={handleExport}
						isExporting={isExporting}
						canExport={loaderData.total > 0}
					/>
				</div>
				<Card className="space-y-2 mb-2">
					<AdminTable
						data={data.admins}
						currentUserId={data.currentUserId}
						churchAdminId={data.churchAdminId}
						onRemoveAdmin={handleRemoveAdmin}
						onResetPassword={handleResetPassword}
					/>

					<div className="flex justify-center pb-2">
						<Button
							size="sm"
							type="button"
							variant="ghost"
							disabled={data.filterData.take >= data.total}
							className="bg-neutral-200 rounded-full"
							onClick={handleDisplayMore}
						>
							Voir plus
						</Button>
					</div>
				</Card>
			</div>

			{openAddForm && <AddAdminForm onClose={handleClose} />}

			{adminToResetPassword && (
				<ResetPasswordForm
					admin={adminToResetPassword}
					isLoading={isResettingPassword}
					onConfirm={confirmResetPassword}
					onCancel={cancelResetPassword}
				/>
			)}

			{adminToRemove && (
				<Dialog open={!!adminToRemove} onOpenChange={cancelRemoveAdmin}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Confirmer le retrait</DialogTitle>
							<DialogDescription>
								Êtes-vous sûr de vouloir retirer le rôle administrateur à{' '}
								<strong>{adminToRemove.name}</strong> ?{' '}
								{data.admins.find(a => a.id === adminToRemove.id)?.roles
									.length === 1
									? 'Cette personne perdra également son accès et son mot de passe sera supprimé.'
									: 'Cette personne conservera ses autres rôles et pourra toujours se connecter.'}
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="gap-2">
							<Button variant="outline" onClick={cancelRemoveAdmin}>
								Annuler
							</Button>
							<ButtonLoading
								onClick={confirmRemoveAdmin}
								loading={isRemovingAdmin}
								variant="destructive"
							>
								Retirer
							</ButtonLoading>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			<SpeedDialMenu
				items={speedDialItems}
				onClick={handleSpeedDialItemClick}
			/>
		</MainContent>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
