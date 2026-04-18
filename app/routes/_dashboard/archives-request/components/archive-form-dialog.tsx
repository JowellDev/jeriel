import { useMediaQuery } from 'usehooks-ts'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '~/components/ui/drawer'
import { Button } from '~/components/ui/button'
import { useFetcher } from '@remix-run/react'
import type { ActionType } from '../action.server'
import type { ArchiveRequest, User } from '../model'
import { MOBILE_WIDTH } from '~/shared/constants'
import MainForm from './main-form'
import { useCallback, useEffect, useState } from 'react'
import type { RowSelectionState } from '@tanstack/react-table'
import type { AuthorizedEntity } from '../../dashboard/types'
import { buildSearchParams } from '../../../../utils/url'
import { useApiData } from '../../../../hooks/api-data.hook'
import { toast } from 'sonner'

interface Props {
	onClose: () => void
	authorizedEntities: AuthorizedEntity[]
	editRequest?: ArchiveRequest
}

export function ArchiveFormDialog({
	onClose,
	authorizedEntities,
	editRequest,
}: Props) {
	const isDesktop = useMediaQuery(MOBILE_WIDTH)
	const fetcher = useFetcher<ActionType>()
	const [archiveRequest, setArchiveRequest] = useState<ArchiveRequest>({
		usersToArchive: [],
	})
	const [initialRowSelection, setInitialRowSelection] =
		useState<RowSelectionState>({})

	const isSubmitting = ['loading', 'submitting'].includes(fetcher.state)

	const title = editRequest
		? "Modifier la demande d'archivage"
		: "Demande d'archivage"

	const defaultEntity =
		authorizedEntities.length > 0
			? (editRequest
					? (authorizedEntities.find(e => e.name === editRequest.origin) ??
						authorizedEntities[0])
					: authorizedEntities[0])
			: undefined

	function getEntityParams(entity: AuthorizedEntity) {
		return buildSearchParams({
			...(entity.type === 'tribe' ? { tribeId: entity.id } : {}),
			...(entity.type === 'department' ? { departmentId: entity.id } : {}),
			...(entity.type === 'honorFamily' ? { honorFamilyId: entity.id } : {}),
			isAdmin: false,
			isActive: true,
			excludeFromArchiveRequests: true,
			...(editRequest?.id ? { currentRequestId: editRequest.id } : {}),
		})
	}

	const initialUrl = defaultEntity
		? `/api/get-all-members?${getEntityParams(defaultEntity)}`
		: ''

	const apiData = useApiData<User[]>(initialUrl)

	const getSelectedEntityMembers = useCallback(
		(entity?: AuthorizedEntity) => {
			if (!entity) return
			const params = getEntityParams(entity)
			apiData.refresh(params)
		},
		// apiData.refresh is now stable (useCallback in the hook)
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[apiData.refresh],
	)

	useEffect(() => {
		if (fetcher.state === 'idle' && fetcher.data) {
			const data = fetcher.data as any
			if (data.status === 'success') {
				toast.success('Action effectuée avec succès.')
				onClose()
			} else if (data.status !== 'error') {
				toast.error("Une erreur est survenue. Veuillez réessayer.")
			}
		}
	}, [fetcher.data, fetcher.state, onClose])

	useEffect(() => {
		if (apiData.error) {
			toast.error('Erreur lors du chargement des membres.')
		}
	}, [apiData.error])

	useEffect(() => {
		if (apiData.data) {
			const members = apiData.data
			setArchiveRequest(prev => ({
				...prev,
				usersToArchive: members,
			}))

			if (editRequest) {
				const editIds = new Set(editRequest.usersToArchive.map(u => u.id))
				const selection = members.reduce((acc, user, index) => {
					if (editIds.has(user.id)) acc[index] = true
					return acc
				}, {} as RowSelectionState)
				setInitialRowSelection(selection)
			}
		}
	}, [apiData.data, editRequest])

	if (isDesktop) {
		return (
			<Dialog open onOpenChange={onClose}>
				<DialogContent
					className="md:max-w-3xl"
					onOpenAutoFocus={e => e.preventDefault()}
					onPointerDownOutside={e => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<MainForm
						isLoading={isSubmitting}
						isLoadingMembers={apiData.isLoading}
						archiveRequest={archiveRequest}
						fetcher={fetcher}
						onClose={onClose}
						authorizedEntities={authorizedEntities}
						onFilter={editRequest ? () => {} : getSelectedEntityMembers}
						defaultEntity={defaultEntity}
						requestId={editRequest?.id}
						initialRowSelection={initialRowSelection}
						disableEntitySelect={!!editRequest}
					/>
				</DialogContent>
			</Dialog>
		)
	}

	return (
		<Drawer open onOpenChange={onClose}>
			<DrawerContent>
				<DrawerHeader className="text-left">
					<DrawerTitle>{title}</DrawerTitle>
				</DrawerHeader>
				<MainForm
					isLoading={isSubmitting}
					isLoadingMembers={apiData.isLoading}
					archiveRequest={archiveRequest}
					fetcher={fetcher}
					className="px-4"
					authorizedEntities={authorizedEntities}
					onFilter={editRequest ? () => {} : getSelectedEntityMembers}
					defaultEntity={defaultEntity}
					requestId={editRequest?.id}
					initialRowSelection={initialRowSelection}
					disableEntitySelect={!!editRequest}
				/>
				<DrawerFooter className="pt-2">
					<DrawerClose asChild>
						<Button variant="outline">Fermer</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	)
}
