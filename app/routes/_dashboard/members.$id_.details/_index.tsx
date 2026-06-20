import { Header } from '~/components/layout/header'
import { MainContent } from '~/components/layout/main-content'
import { loaderFn } from './loader.server'
import { actionFn } from './action.server'
import { FORM_INTENT } from './constants'
import { type MetaFunction, useLoaderData, useNavigate } from '@remix-run/react'
import GlobalStats from './components/global-stats'
import { EditMemberForm } from '../members.($id)/components/forms/edit-member-form'
import { useState } from 'react'
import { getMemberAttendanceData } from './utils/member-data'
import { GeneralInfosCard } from './components/general-infos-card'
import { GeneralErrorBoundary } from '~/components/error-boundary'
import { ConfirmDialog } from '~/shared/forms/confirm-form-dialog'

export const loader = loaderFn
export const action = actionFn

export const meta: MetaFunction = () => [
	{ title: 'Information du fidèle | Jeriel' },
]

export default function MemberDetails() {
	const { member, managerInfo } = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const [openEditForm, setOpenEditForm] = useState(false)
	const [openDeleteDialog, setOpenDeleteDialog] = useState(false)

	function handleOnClose() {
		setOpenEditForm(false)
	}

	function handleOnDeleteClose() {
		setOpenDeleteDialog(false)
	}

	const attendanceData = getMemberAttendanceData(member)

	return (
		<MainContent
			headerChildren={
				<Header title="Détails du fidèle" onBack={() => navigate(-1)} />
			}
		>
			<div className="w-full pb-4">
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-4 xl:grid-cols-5">
					<div className="lg:col-span-1 lg:sticky lg:top-0 lg:self-start">
						<GeneralInfosCard
							member={member}
							onEdit={() => setOpenEditForm(true)}
							onDelete={() => setOpenDeleteDialog(true)}
							managerInfo={managerInfo}
						/>
					</div>
					<div className="lg:col-span-3 xl:col-span-4">
						<GlobalStats member={member} attendanceData={attendanceData} />
					</div>
				</div>
			</div>

			{openEditForm && (
				<EditMemberForm onClose={handleOnClose} member={member} />
			)}

			{openDeleteDialog && (
				<ConfirmDialog
					data={member}
					onClose={handleOnDeleteClose}
					title="Supprimer le membre"
					message={`Êtes-vous sûr de vouloir supprimer ${member.name} ? Cette action est irréversible et supprimera toutes les données associées (présences, notifications, etc.).`}
					intent={FORM_INTENT.DELETE_MEMBER}
					confirmText="Supprimer"
					cancelText="Annuler"
					successMessage="Membre supprimé avec succès"
					formAction="."
				/>
			)}
		</MainContent>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
